import axios, { AxiosRequestConfig } from 'axios';

export interface RepoFileChange {
  path: string;
  /** Contenido en base64. */
  contents: string;
}

/** Cliente mínimo de la API de GitHub con el PAT del usuario (el token no se guarda ni se registra). */
export class GithubRepoClient {
  constructor(
    private readonly token: string,
    private readonly apiUrl = 'https://api.github.com',
  ) {}

  private headers() {
    return {
      'User-Agent': 'ChaosLauncher-Backend',
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  private async request<T>(config: AxiosRequestConfig, retries = 3): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await axios.request<T>({
          timeout: 120000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          ...config,
          headers: { ...this.headers(), ...(config.headers || {}) },
        });
        return res.data;
      } catch (err: any) {
        const status = err.response?.status;
        const rateLimited =
          status === 403 && /rate limit|secondary/i.test(JSON.stringify(err.response?.data || ''));
        const transient = !status || status >= 500 || status === 429 || rateLimited;
        if (!transient || attempt >= retries) throw err;
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  async createRepo(
    name: string,
    isPrivate: boolean,
    description: string,
  ): Promise<{ fullName: string; branch: string }> {
    const data: any = await this.request({
      method: 'POST',
      url: `${this.apiUrl}/user/repos`,
      data: { name, private: isPrivate, description, auto_init: true },
    });
    return { fullName: data.full_name, branch: data.default_branch || 'main' };
  }

  /** oid del último commit de la rama (espera a que un repo recién creado tenga su commit inicial). */
  async getHeadOid(repo: string, branch: string, waitMs = 0): Promise<string> {
    const deadline = Date.now() + waitMs;
    for (;;) {
      try {
        const data: any = await this.request(
          { method: 'GET', url: `${this.apiUrl}/repos/${repo}/git/ref/heads/${branch}` },
          1,
        );
        return data.object.sha;
      } catch (err: any) {
        if (Date.now() >= deadline) throw err;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  /** Mapa ruta → blob sha de todos los archivos de la rama. */
  async getTree(repo: string, branch: string): Promise<Map<string, string>> {
    const data: any = await this.request({
      method: 'GET',
      url: `${this.apiUrl}/repos/${repo}/git/trees/${branch}?recursive=1`,
    });
    if (data.truncated) {
      throw new Error('El repositorio tiene demasiados archivos para compararlo de una vez.');
    }
    const map = new Map<string, string>();
    for (const item of data.tree || []) {
      if (item.type === 'blob') map.set(item.path, item.sha);
    }
    return map;
  }

  async getFileText(repo: string, branch: string, path: string): Promise<string | null> {
    try {
      const data: any = await this.request(
        { method: 'GET', url: `${this.apiUrl}/repos/${repo}/contents/${path}?ref=${branch}` },
        1,
      );
      return Buffer.from(data.content || '', 'base64').toString('utf8');
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }

  /** Un solo commit con muchos archivos (GraphQL createCommitOnBranch). Devuelve el nuevo oid y la URL. */
  async commitFiles(
    repo: string,
    branch: string,
    expectedHeadOid: string,
    message: string,
    additions: RepoFileChange[],
    deletions: string[],
  ): Promise<{ oid: string; url: string }> {
    const graphqlUrl = this.apiUrl.includes('api.github.com')
      ? 'https://api.github.com/graphql'
      : `${this.apiUrl.replace(/\/$/, '')}/graphql`;
    const data: any = await this.request(
      {
        method: 'POST',
        url: graphqlUrl,
        data: {
          query:
            'mutation($input: CreateCommitOnBranchInput!){ createCommitOnBranch(input:$input){ commit { oid url } } }',
          variables: {
            input: {
              branch: { repositoryNameWithOwner: repo, branchName: branch },
              message: { headline: message },
              expectedHeadOid,
              fileChanges: {
                additions: additions.map((a) => ({ path: a.path, contents: a.contents })),
                deletions: deletions.map((path) => ({ path })),
              },
            },
          },
        },
      },
      3,
    );
    if (data.errors?.length) {
      throw new Error(`GitHub rechazó el commit: ${data.errors.map((e: any) => e.message).join('; ')}`);
    }
    const commit = data.data?.createCommitOnBranch?.commit;
    return { oid: commit.oid, url: commit.url };
  }

  /** Release con los archivos grandes (>40 MB), que no caben en un commit normal. */
  async ensureRelease(repo: string, tag: string): Promise<{ id: number }> {
    try {
      const rel: any = await this.request(
        { method: 'GET', url: `${this.apiUrl}/repos/${repo}/releases/tags/${tag}` },
        1,
      );
      return { id: rel.id };
    } catch (err: any) {
      if (err.response?.status !== 404) throw err;
    }
    const rel: any = await this.request({
      method: 'POST',
      url: `${this.apiUrl}/repos/${repo}/releases`,
      data: {
        tag_name: tag,
        name: 'Archivos del modpack',
        body: 'Archivos grandes del modpack (generado por Chaos Launcher Studio).',
        prerelease: false,
      },
    });
    return { id: rel.id };
  }

  /** Sube un archivo grande al release. Si ya existe uno con ese nombre, devuelve su URL. */
  async uploadAsset(repo: string, releaseId: number, name: string, content: Buffer): Promise<string> {
    const uploadsHost = this.apiUrl.includes('api.github.com') ? 'https://uploads.github.com' : this.apiUrl;
    try {
      const data: any = await this.request(
        {
          method: 'POST',
          url: `${uploadsHost}/repos/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(name)}`,
          data: content,
          headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(content.length) },
          timeout: 600000,
        },
        2,
      );
      return data.browser_download_url;
    } catch (err: any) {
      if (err.response?.status === 422) {
        const assets: any[] = await this.request({
          method: 'GET',
          url: `${this.apiUrl}/repos/${repo}/releases/${releaseId}/assets?per_page=100`,
        });
        const existing = assets.find((a) => a.name === name);
        if (existing) return existing.browser_download_url;
      }
      throw err;
    }
  }
}
