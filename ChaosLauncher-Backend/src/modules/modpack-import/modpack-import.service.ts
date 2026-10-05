import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LoaderType, Role } from '@prisma/client';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { assertModpackOwner, AuthUser, normalizeGithubRepo } from '../../common/utils/ownership';
import { bumpVersion, GithubService, maxSemver } from '../github/github.service';
import { CurseForgeService, ResolvedMod } from './curseforge.service';
import { GithubRepoClient, RepoFileChange } from './github-repo.client';
import { gitBlobSha, sha1Hex } from './git-hash';
import { diffTrees } from './import-diff';
import { isManagedOverridePath, isOverrideMod, MANAGED_DIRS } from './import-paths';
import { buildChangelog, encodePath, parseLoader, slugify } from './manifest-utils';
import { iterateZip, readZipEntry } from './zip-reader';

/** Por encima de este tamaño un archivo va a un Release de GitHub en vez de al commit. */
export const LARGE_FILE_BYTES = 40 * 1024 * 1024;
const BATCH_BYTES = 20 * 1024 * 1024;
const BATCH_FILES = 300;
const RELEASE_TAG = 'modpack-assets';

export interface ImportParams {
  zipPath: string;
  githubToken: string;
  user: AuthUser;
  modpackTag?: string;
  repoName?: string;
  isPrivate?: boolean;
  serverIp?: string;
  serverPort?: number;
}

export interface ImportResult {
  unchanged: boolean;
  tag: string;
  repo: string;
  repoUrl: string;
  version: string;
  previousVersion: string | null;
  created: boolean;
  totalFiles: number;
  changes: { added: number; modified: number; removed: number };
  commitUrl?: string;
  unresolvedMods: Array<{ projectID: number; fileID: number }>;
  largeFiles: number;
  ignoredModJars: number;
}

export interface ImportJob {
  id: string;
  userId: string;
  status: 'running' | 'done' | 'error';
  stage: string;
  percent: number;
  log: string[];
  result?: ImportResult;
  error?: string;
  createdAt: number;
}

interface ScannedFile {
  rel: string;
  zipName: string;
  size: number;
  sha1: string;
  gitSha: string;
}

interface ManifestFile {
  path: string;
  sha1: string;
  size: number;
  downloadUrl: string;
}

const LOADER_MAP: Record<string, LoaderType> = {
  neoforge: LoaderType.NEOFORGE,
  forge: LoaderType.FORGE,
  fabric: LoaderType.FABRIC,
  quilt: LoaderType.FABRIC,
  vanilla: LoaderType.VANILLA,
};

@Injectable()
export class ModpackImportService {
  private readonly logger = new Logger(ModpackImportService.name);
  private readonly jobs = new Map<string, ImportJob>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly curseforge: CurseForgeService,
  ) {}

  /** Valida lo que se puede validar de inmediato y lanza el trabajo en segundo plano. */
  start(params: ImportParams): ImportJob {
    if (!params.githubToken?.trim()) {
      throw new BadRequestException('Se requiere un Personal Access Token (PAT) de GitHub con permiso "repo".');
    }
    for (const j of this.jobs.values()) {
      if (j.userId === params.user.id && j.status === 'running') {
        throw new BadRequestException('Ya tienes una importación en curso. Espera a que termine.');
      }
    }

    const job: ImportJob = {
      id: randomUUID(),
      userId: params.user.id,
      status: 'running',
      stage: 'Iniciando',
      percent: 0,
      log: [],
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);

    this.execute(job, params)
      .then((result) => {
        job.result = result;
        job.status = 'done';
        job.stage = result.unchanged ? 'Sin cambios' : 'Completado';
        job.percent = 100;
      })
      .catch((err: any) => {
        this.logger.error(`Importación ${job.id} falló: ${err.message}`);
        job.status = 'error';
        job.error = err instanceof BadRequestException ? err.message : this.friendly(err);
      })
      .finally(() => {
        fs.promises.unlink(params.zipPath).catch(() => undefined);
        setTimeout(() => this.jobs.delete(job.id), 2 * 60 * 60 * 1000).unref?.();
      });

    return job;
  }

  getJob(id: string, user: AuthUser): ImportJob {
    const job = this.jobs.get(id);
    if (!job) throw new NotFoundException('Importación no encontrada o caducada.');
    if (job.userId !== user.id && user.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Esta importación pertenece a otro usuario.');
    }
    return job;
  }

  private friendly(err: any): string {
    const status = err?.response?.status;
    const ghMsg = err?.response?.data?.message;
    if (status === 401) return 'GitHub rechazó el token. Comprueba que el PAT sea válido y no haya caducado.';
    if (status === 403) return `GitHub denegó el acceso: ${ghMsg || 'el token necesita permiso "repo"'}.`;
    if (status === 404) return 'GitHub no encontró el repositorio. Comprueba el nombre y que tu token tenga acceso.';
    if (status === 422) return `GitHub rechazó la petición: ${ghMsg || 'datos inválidos'} (¿ya existe un repositorio con ese nombre?).`;
    return err?.message || 'Error desconocido durante la importación.';
  }

  private step(job: ImportJob, stage: string, percent: number, line?: string) {
    job.stage = stage;
    job.percent = Math.max(job.percent, Math.min(99, percent));
    if (line) {
      job.log.push(line);
      if (job.log.length > 300) job.log.splice(0, job.log.length - 300);
    }
  }

  private async execute(job: ImportJob, p: ImportParams): Promise<ImportResult> {
    // 1. manifest.json de CurseForge
    this.step(job, 'Leyendo el ZIP', 2, 'Leyendo manifest.json…');
    const manifestBuf = await readZipEntry(p.zipPath, 'manifest.json');
    if (!manifestBuf) {
      throw new BadRequestException('El ZIP no contiene manifest.json. Debe ser una exportación de modpack de CurseForge.');
    }
    let cf: any;
    try {
      cf = JSON.parse(manifestBuf.toString('utf8'));
    } catch {
      throw new BadRequestException('El manifest.json del ZIP no es un JSON válido.');
    }
    const name: string = (cf.name || '').toString().trim();
    if (!name) throw new BadRequestException('El manifest.json no tiene nombre de modpack.');
    const mcVersion: string = cf.minecraft?.version || '';
    if (!mcVersion) throw new BadRequestException('El manifest.json no indica la versión de Minecraft.');
    const loader = parseLoader(
      (cf.minecraft?.modLoaders || []).find((l: any) => l.primary)?.id || cf.minecraft?.modLoaders?.[0]?.id,
    );
    const cfFiles: Array<{ projectID: number; fileID: number }> = Array.isArray(cf.files) ? cf.files : [];
    const overridesPrefix = `${(cf.overrides || 'overrides').replace(/\/$/, '')}/`;

    if (cfFiles.length > 0 && !this.curseforge.isConfigured()) {
      throw new BadRequestException(
        'Falta CURSEFORGE_API_KEY en el backend: es necesaria para resolver los mods del ZIP. Consíguela gratis en console.curseforge.com.',
      );
    }

    // 2. Escanear overrides/ (hashes sin guardar el contenido en memoria)
    this.step(job, 'Analizando archivos', 6, 'Analizando overrides/…');
    const scanned: ScannedFile[] = [];
    let ignoredModJars = 0;
    await iterateZip(p.zipPath, async (entry, read) => {
      if (!entry.fileName.startsWith(overridesPrefix) || entry.fileName.endsWith('/')) return;
      const rel = entry.fileName.slice(overridesPrefix.length);
      if (isOverrideMod(rel)) {
        ignoredModJars++;
        return;
      }
      if (!isManagedOverridePath(rel)) return;
      const buf = await read();
      scanned.push({ rel, zipName: entry.fileName, size: buf.length, sha1: sha1Hex(buf), gitSha: gitBlobSha(buf) });
    });
    const large = scanned.filter((f) => f.size > LARGE_FILE_BYTES);
    const regular = scanned.filter((f) => f.size <= LARGE_FILE_BYTES);
    this.step(job, 'Analizando archivos', 15, `${scanned.length} archivos del modpack (${large.length} grandes).`);

    // 3. Mods desde CurseForge
    this.step(job, 'Resolviendo mods', 18, `Consultando ${cfFiles.length} mods en CurseForge…`);
    const resolved: Map<number, ResolvedMod> =
      cfFiles.length > 0 ? await this.curseforge.resolveFiles(cfFiles.map((f) => f.fileID)) : new Map();
    const mods: ManifestFile[] = [];
    const unresolvedMods: ImportResult['unresolvedMods'] = [];
    for (const f of cfFiles) {
      const r = resolved.get(f.fileID);
      if (!r) {
        unresolvedMods.push({ projectID: f.projectID, fileID: f.fileID });
        continue;
      }
      mods.push({ path: `mods/${r.fileName}`, sha1: r.sha1, size: r.size, downloadUrl: r.downloadUrl });
    }
    this.step(job, 'Resolviendo mods', 28, `${mods.length} mods resueltos, ${unresolvedMods.length} sin resolver.`);

    // 4. Modpack en la base de datos y repositorio de GitHub
    const tag = p.modpackTag || slugify(name);
    const existing = await this.prisma.modpack.findUnique({ where: { tag } });
    if (p.modpackTag && !existing) throw new NotFoundException(`Modpack "${p.modpackTag}" no encontrado.`);
    if (existing) await assertModpackOwner(this.prisma, tag, p.user);

    const client = new GithubRepoClient(p.githubToken.trim());
    let repo: string;
    let branch = existing?.githubBranch || 'main';
    let repoIsNew = false;
    if (existing?.githubRepo) {
      repo = normalizeGithubRepo(existing.githubRepo);
      this.step(job, 'Preparando repositorio', 32, `Actualizando el repositorio existente ${repo}.`);
    } else {
      const repoName = (p.repoName || tag).trim().replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 90) || tag;
      this.step(job, 'Creando repositorio', 32, `Creando el repositorio ${repoName} en GitHub…`);
      const created = await client.createRepo(repoName, !!p.isPrivate, `Modpack ${name} (Chaos Launcher)`);
      repo = created.fullName;
      branch = created.branch;
      repoIsNew = true;
    }

    const loaderType = LOADER_MAP[loader.type] || LoaderType.NEOFORGE;
    if (!existing) {
      await this.prisma.modpack.create({
        data: {
          name,
          tag,
          serverIp: p.serverIp || '',
          serverPort: p.serverPort || 25565,
          version: '1.0.0',
          minecraftVersion: mcVersion,
          loaderType,
          loaderVersion: loader.version,
          recommendedRam: cf.minecraft?.recommendedRam || 6144,
          githubRepo: repo,
          githubBranch: branch,
          authorId: p.user.id,
        },
      });
    } else if (!existing.githubRepo) {
      await this.prisma.modpack.update({ where: { tag }, data: { githubRepo: repo, githubBranch: branch } });
    }

    // 5. Diferencias con el repositorio (sin descargar nada: se comparan blob SHA)
    this.step(job, 'Comparando con el repositorio', 38, 'Comparando con el contenido actual del repo…');
    let head = await client.getHeadOid(repo, branch, repoIsNew ? 30000 : 0);
    const remote = await client.getTree(repo, branch);
    const local = new Map(regular.map((f) => [f.rel, f.gitSha]));
    const removable = (path: string) => {
      const top = path.split('/')[0];
      // Nunca se borran los .jar que pueda haber en mods/ ni archivos fuera de las carpetas del modpack
      return (MANAGED_DIRS as readonly string[]).includes(top) && top !== 'mods';
    };
    const diff = diffTrees(local, remote, removable);

    // 6. Manifiesto nuevo y comparación con el anterior
    const prevText = await client.getFileText(repo, branch, 'modpack.json');
    let prev: any = null;
    try {
      prev = prevText ? JSON.parse(prevText) : null;
    } catch {
      prev = null;
    }
    const prevFiles = new Map<string, ManifestFile>((prev?.files || []).map((f: ManifestFile) => [f.path, f]));

    const assetName = (f: ScannedFile) =>
      `${f.sha1.slice(0, 10)}-${(f.rel.split('/').pop() || 'file').replace(/[^A-Za-z0-9._-]/g, '_')}`;
    const rawBase = `https://raw.githubusercontent.com/${repo}/${branch}`;
    const overrideFiles: ManifestFile[] = [
      ...regular.map((f) => ({ path: f.rel, sha1: f.sha1, size: f.size, downloadUrl: `${rawBase}/${encodePath(f.rel)}` })),
      ...large.map((f) => ({
        path: f.rel,
        sha1: f.sha1,
        size: f.size,
        downloadUrl: `https://github.com/${repo}/releases/download/${RELEASE_TAG}/${assetName(f)}`,
      })),
    ];
    const byPath = new Map<string, ManifestFile>();
    for (const f of [...overrideFiles, ...mods]) byPath.set(f.path, f);
    const files = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));

    const changes = { added: [] as string[], modified: [] as string[], removed: [] as string[] };
    for (const f of files) {
      const old = prevFiles.get(f.path);
      if (!old) changes.added.push(f.path);
      else if (old.sha1 !== f.sha1) changes.modified.push(f.path);
    }
    for (const path of prevFiles.keys()) if (!byPath.has(path)) changes.removed.push(path);

    const gitChanged = diff.added.length + diff.modified.length + diff.removed.length > 0;
    const manifestChanged = changes.added.length + changes.modified.length + changes.removed.length > 0;
    const previousVersion: string | null = prev?.version || existing?.version || null;

    if (prev && !gitChanged && !manifestChanged) {
      this.step(job, 'Sin cambios', 99, 'El ZIP no tiene cambios respecto al repositorio.');
      return {
        unchanged: true,
        tag,
        repo,
        repoUrl: `https://github.com/${repo}`,
        version: previousVersion || '1.0.0',
        previousVersion,
        created: false,
        totalFiles: files.length,
        changes: { added: 0, modified: 0, removed: 0 },
        unresolvedMods,
        largeFiles: large.length,
        ignoredModJars,
      };
    }

    const version = prev ? bumpVersion(maxSemver(prev.version, existing?.version), 'patch') : existing?.version || '1.0.0';

    // 7. Archivos grandes → Release de GitHub
    const needUpload = large.filter((f) => {
      const old = prevFiles.get(f.rel);
      return !(old && old.sha1 === f.sha1 && old.downloadUrl.includes(`/releases/download/${RELEASE_TAG}/`));
    });
    if (needUpload.length > 0) {
      this.step(job, 'Subiendo archivos grandes', 42, `Subiendo ${needUpload.length} archivo(s) grande(s) al release…`);
      const release = await client.ensureRelease(repo, RELEASE_TAG);
      const wanted = new Map(needUpload.map((f) => [f.zipName, f]));
      await iterateZip(p.zipPath, async (entry, read) => {
        const f = wanted.get(entry.fileName);
        if (!f) return;
        const buf = await read();
        await client.uploadAsset(repo, release.id, assetName(f), buf);
        this.step(job, 'Subiendo archivos grandes', 50, `Subido ${f.rel} (${(f.size / 1048576).toFixed(0)} MB).`);
      });
    }

    // 8. Commits de los archivos pequeños nuevos, modificados y eliminados
    const toUpload = new Set([...diff.added, ...diff.modified]);
    const zipNameByRel = new Map(regular.map((f) => [f.zipName, f.rel]));
    let batch: RepoFileChange[] = [];
    let batchBytes = 0;
    let sent = 0;
    let commitUrl: string | undefined;
    let commitNo = 0;
    const message = (n: number) => `chore: sincronizar ${name} v${version} (lote ${n})`;
    const flush = async (deletions: string[] = []) => {
      if (batch.length === 0 && deletions.length === 0) return;
      const res = await client.commitFiles(repo, branch, head, message(++commitNo), batch, deletions);
      head = res.oid;
      commitUrl = res.url;
      sent += batch.length;
      batch = [];
      batchBytes = 0;
      this.step(
        job,
        'Subiendo archivos',
        55 + Math.round((sent / Math.max(1, toUpload.size)) * 30),
        `Commit ${commitNo}: ${sent}/${toUpload.size} archivos.`,
      );
    };
    if (toUpload.size > 0) {
      await iterateZip(p.zipPath, async (entry, read) => {
        const rel = zipNameByRel.get(entry.fileName);
        if (!rel || !toUpload.has(rel)) return;
        const buf = await read();
        batch.push({ path: rel, contents: buf.toString('base64') });
        batchBytes += buf.length;
        if (batchBytes >= BATCH_BYTES || batch.length >= BATCH_FILES) await flush();
      });
    }
    await flush(diff.removed);

    // 9. modpack.json + sincronización de la base de datos
    this.step(job, 'Publicando manifiesto', 90, `Publicando modpack.json v${version}…`);
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const manifest = {
      name: existing?.name || name,
      version,
      minecraftVersion: mcVersion,
      loader: { type: loader.type, version: loader.version },
      server:
        p.serverIp || existing?.serverIp
          ? { ip: p.serverIp || existing?.serverIp, port: p.serverPort || existing?.serverPort || 25565 }
          : prev?.server,
      recommendedRam: existing?.recommendedRam || cf.minecraft?.recommendedRam || prev?.recommendedRam || 6144,
      optionalMods: prev?.optionalMods || [],
      downloadUrl: `${rawBase}/modpack.json`,
      forceUpdate: prev?.forceUpdate ?? existing?.forceUpdate ?? true,
      changelog: prev ? buildChangelog(version, files.length, changes) : [`✨ Importación inicial de ${name} (${files.length} archivos)`],
      fileSizeMb: Math.round((totalBytes / (1024 * 1024)) * 10) / 10,
      files,
    };
    const pushed = await this.githubService.pushManifest(
      {
        repo,
        branch,
        githubToken: p.githubToken.trim(),
        manifest,
        commitMessage: `chore: modpack.json v${version} (importado desde ZIP)`,
        modpackTag: tag,
      } as any,
      p.user,
    );

    return {
      unchanged: false,
      tag,
      repo,
      repoUrl: `https://github.com/${repo}`,
      version,
      previousVersion: prev ? previousVersion : null,
      created: !existing,
      totalFiles: files.length,
      changes: { added: changes.added.length, modified: changes.modified.length, removed: changes.removed.length },
      commitUrl: pushed?.commitUrl || commitUrl,
      unresolvedMods,
      largeFiles: large.length,
      ignoredModJars,
    };
  }
}
