import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { assertModpackOwner, AuthUser, normalizeGithubRepo } from '../../common/utils/ownership';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoaderType } from '@prisma/client';
import { GenerateManifestDto, ManifestScope } from './dto/generate-manifest.dto';
import { PushManifestDto } from './dto/push-manifest.dto';

export interface GeneratedFileEntry {
  path: string;
  sha1: string;
  size: number;
  downloadUrl: string;
}

export function compareSemver(v1?: string, v2?: string): number {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;
  const p1 = v1.replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = v2.replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
  while (p1.length < 3) p1.push(0);
  while (p2.length < 3) p2.push(0);

  for (let i = 0; i < 3; i++) {
    if (p1[i] > p2[i]) return 1;
    if (p1[i] < p2[i]) return -1;
  }
  return 0;
}

export function maxSemver(v1?: string, v2?: string): string {
  if (!v1) return v2 || '1.0.0';
  if (!v2) return v1;
  return compareSemver(v1, v2) >= 0 ? v1 : v2;
}

export function bumpVersion(versionStr?: string, type: 'patch' | 'minor' | 'major' = 'patch'): string {
  if (!versionStr) return '1.0.1';
  const clean = versionStr.replace(/^v/i, '').trim();
  const parts = clean.split('.').map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });

  while (parts.length < 3) {
    parts.push(0);
  }

  if (type === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else {
    // patch
    parts[2] += 1;
  }

  return parts.join('.');
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly token: string;
  private readonly apiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>('github.token') || '';
    this.apiUrl = this.configService.get<string>('github.apiUrl') || 'https://api.github.com';
  }

  private getHeaders(customToken?: string) {
    const headers: Record<string, string> = {
      'User-Agent': 'ChaosLauncher-Backend',
      Accept: 'application/vnd.github.v3+json',
    };
    const activeToken = customToken || this.token;
    if (activeToken) {
      headers['Authorization'] = `token ${activeToken}`;
    }
    return headers;
  }

  private sanitizeBranch(raw?: string): string {
    const branch = raw?.trim() || 'main';
    if (!/^[A-Za-z0-9._\/-]{1,100}$/.test(branch) || branch.includes('..')) {
      throw new BadRequestException('Nombre de rama inválido');
    }
    return branch;
  }

  async getReleases(repo: string) {
    const cleanRepo = normalizeGithubRepo(repo);
    const url = `${this.apiUrl}/repos/${cleanRepo}/releases`;

    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      return response.data;
    } catch (err: any) {
      this.logger.error(`Error al consultar releases de GitHub para ${cleanRepo}: ${err.message}`);
      throw new BadRequestException(`No se pudieron obtener los releases de ${cleanRepo}: ${err.response?.data?.message || err.message}`);
    }
  }

  async syncModpackFromRepo(tag: string, user?: AuthUser) {
    if (user) {
      await assertModpackOwner(this.prisma, tag, user);
    }
    const modpack = await this.prisma.modpack.findUnique({
      where: { tag },
    });

    if (!modpack) {
      throw new NotFoundException(`Modpack "${tag}" no fue encontrado.`);
    }

    if (!modpack.githubRepo) {
      throw new BadRequestException(`El modpack "${tag}" no tiene un repositorio de GitHub configurado.`);
    }

    const cleanRepo = normalizeGithubRepo(modpack.githubRepo);
    const branch = modpack.githubBranch || 'main';

    // Intentar buscar modpack.json en la raíz o en modpack-server-example
    const possibleUrls = [
      `https://raw.githubusercontent.com/${cleanRepo}/${branch}/modpack.json`,
      `https://raw.githubusercontent.com/${cleanRepo}/${branch}/modpack-server-example/modpack.json`,
    ];

    let manifestData: any = null;
    let successfulUrl = '';

    for (const url of possibleUrls) {
      try {
        const res = await axios.get(url, { timeout: 8000 });
        if (res.data && (res.data.name || res.data.version)) {
          manifestData = res.data;
          successfulUrl = url;
          break;
        }
      } catch {
        // Continuar buscando en la siguiente ruta
      }
    }

    if (!manifestData) {
      throw new NotFoundException(
        `No se pudo encontrar un archivo modpack.json válido en el repositorio ${cleanRepo} (rama: ${branch}).`,
      );
    }

    this.logger.log(`Encontrado modpack.json en ${successfulUrl}`);

    // Normalizar loader type
    let loaderType: LoaderType = LoaderType.NEOFORGE;
    const rawType = (manifestData.loader?.type || 'neoforge').toUpperCase();
    if (rawType in LoaderType) {
      loaderType = rawType as LoaderType;
    }

    // Actualizar versiones
    const newVersion = manifestData.version || modpack.version;
    const changelog = Array.isArray(manifestData.changelog) ? manifestData.changelog : [];

    // Comprobar si ya existe registro de versión activa en la BD
    const currentVersionRecord = await this.prisma.modpackVersion.findFirst({
      where: { modpackId: modpack.id, isCurrent: true },
      include: { files: true },
    });

    const isDifferentVersion = newVersion !== modpack.version;
    const isDifferentFilesCount = Boolean(
      currentVersionRecord &&
      manifestData.files &&
      Array.isArray(manifestData.files) &&
      currentVersionRecord.files.length !== manifestData.files.length
    );
    const shouldUpdateVersionRecord = !currentVersionRecord || isDifferentVersion || isDifferentFilesCount;

    if (shouldUpdateVersionRecord) {
      await this.prisma.modpackVersion.updateMany({
        where: { modpackId: modpack.id },
        data: { isCurrent: false },
      });

      await this.prisma.modpackVersion.create({
        data: {
          modpackId: modpack.id,
          version: newVersion,
          changelog,
          fileSizeMb: manifestData.fileSizeMb || null,
          sha1: manifestData.sha1 || null,
          isCurrent: true,
          files: manifestData.files && Array.isArray(manifestData.files)
            ? {
                create: manifestData.files.map((f: any) => ({
                  path: f.path,
                  sha1: f.sha1,
                  size: f.size,
                  downloadUrl: f.downloadUrl,
                })),
              }
            : undefined,
        },
      });
    }

    // Actualizar datos del modpack
    const updated = await this.prisma.modpack.update({
      where: { id: modpack.id },
      data: {
        name: manifestData.name || modpack.name,
        version: newVersion,
        minecraftVersion: manifestData.minecraftVersion || modpack.minecraftVersion,
        loaderType,
        loaderVersion: manifestData.loader?.version || modpack.loaderVersion,
        downloadUrl: manifestData.downloadUrl || modpack.downloadUrl,
        forceUpdate: manifestData.forceUpdate !== undefined ? manifestData.forceUpdate : modpack.forceUpdate,
      },
      include: {
        versions: { where: { isCurrent: true } },
        optionalMods: true,
      },
    });

    return {
      message: `Modpack "${modpack.name}" sincronizado con éxito desde GitHub`,
      sourceUrl: successfulUrl,
      modpack: updated,
    };
  }

  /**
   * Genera un manifiesto modpack.json escaneando el repositorio de GitHub.
   * Utiliza la API Git Trees de GitHub y realiza hash incremental aprovechando
   * el modpack.json previo del repositorio si ya existe.
   */
  async generateManifest(dto: GenerateManifestDto) {
    const cleanRepo = normalizeGithubRepo(dto.repo);
    const branch = this.sanitizeBranch(dto.branch);
    const scope = dto.scope || ManifestScope.MODS;
    const headers = this.getHeaders(dto.token);

    this.logger.log(`Iniciando generación de manifest para ${cleanRepo} (${branch}), scope: ${scope}`);

    // 1. Intentar cargar el modpack.json existente para reutilizar hashes SHA-1 conocidos
    const existingFileMap = new Map<string, { sha1: string; size: number; downloadUrl?: string }>();
    let existingManifest: any = null;

    try {
      const existingUrl = `https://raw.githubusercontent.com/${cleanRepo}/${branch}/modpack.json`;
      const res = await axios.get(existingUrl, { timeout: 60000, headers });
      if (res.data && typeof res.data === 'object') {
        existingManifest = res.data;
        if (Array.isArray(existingManifest.files)) {
          for (const f of existingManifest.files) {
            if (f.path && f.sha1 && typeof f.size === 'number') {
              existingFileMap.set(f.path, f);
            }
          }
        }
        this.logger.log(`Cargado modpack.json previo con ${existingFileMap.size} archivos en caché`);
      }
    } catch {
      // Repositorio nuevo o sin modpack.json previo
    }

    // 2. Obtener el árbol Git completo del repositorio en 1 sola llamada
    const treeUrl = `${this.apiUrl}/repos/${cleanRepo}/git/trees/${branch}?recursive=1`;
    let treeEntries: Array<{ path: string; type: string; size?: number; sha?: string }> = [];

    try {
      const treeRes = await axios.get(treeUrl, { headers, timeout: 60000 });
      if (treeRes.data && Array.isArray(treeRes.data.tree)) {
        treeEntries = treeRes.data.tree;
      }
    } catch (err: any) {
      this.logger.error(`Error consultando Git Tree de GitHub para ${cleanRepo}: ${err.message}`);
      throw new BadRequestException(
        `No se pudo leer el repositorio ${cleanRepo} en la rama ${branch}: ${err.response?.data?.message || err.message}`,
      );
    }

    // 3. Filtrar archivos según el alcance (scope)
    const matchingBlobs = treeEntries.filter((item) => {
      if (item.type !== 'blob') return false;
      const p = item.path;

      // Excluir archivos del sistema y de Git
      if (p.startsWith('.') || p.startsWith('.git') || p.startsWith('.github')) return false;
      if (p === 'modpack.json' || p === 'README.md' || p === 'LICENSE' || p === 'pack.mcmeta') return false;
      if (p.endsWith('.tmp') || p.endsWith('.log') || p.endsWith('.bak')) return false;
      if (p.includes('.DS_Store') || p.includes('Thumbs.db')) return false;
      if (p.includes('.toml_backup') || p.includes('.lock') || p.includes('.config_generation')) return false;

      // Excluir configuraciones personales y controles del jugador
      const fileNameLower = p.split('/').pop()?.toLowerCase() || '';
      if (
        fileNameLower === 'options.txt' ||
        fileNameLower === 'optionsof.txt' ||
        fileNameLower === 'optionsshaders.txt' ||
        fileNameLower === 'servers.dat' ||
        fileNameLower === 'usercache.json' ||
        fileNameLower === 'command_history.txt' ||
        fileNameLower === 'hotbar.nbt'
      ) {
        return false;
      }

      if (scope === ManifestScope.MODS) {
        // Solo mods/*.jar o mods/*.zip
        return (p.startsWith('mods/') || p.startsWith('mods\\')) && (p.endsWith('.jar') || p.endsWith('.zip'));
      }

      // En scope 'all', incluir carpetas del juego del modpack
      return (
        p.startsWith('mods/') ||
        p.startsWith('config/') ||
        p.startsWith('defaultconfigs/') ||
        p.startsWith('kubejs/') ||
        p.startsWith('shaderpacks/') ||
        p.startsWith('resourcepacks/') ||
        p.startsWith('patchouli_books/') ||
        p.startsWith('fancymenu_data/')
      );
    });

    if (matchingBlobs.length === 0) {
      throw new BadRequestException(
        `No se encontraron archivos válidos en ${cleanRepo} (${branch}) para el alcance seleccionado (${scope}). Asegúrate de tener una carpeta "mods/" con archivos .jar.`,
      );
    }

    this.logger.log(`Encontrados ${matchingBlobs.length} archivos coincidentes en el repositorio`);

    // 4. Separar archivos en cacheados vs pendientes de cálculo SHA-1
    const resultFiles: GeneratedFileEntry[] = [];
    const pendingCalculation: typeof matchingBlobs = [];
    let cachedCount = 0;

    for (const blob of matchingBlobs) {
      const cached = existingFileMap.get(blob.path);
      if (cached && cached.size === (blob.size || 0) && cached.sha1) {
        resultFiles.push({
          path: blob.path,
          sha1: cached.sha1,
          size: blob.size || cached.size,
          downloadUrl: cached.downloadUrl || `https://raw.githubusercontent.com/${cleanRepo}/${branch}/${blob.path}`,
        });
        cachedCount++;
      } else {
        pendingCalculation.push(blob);
      }
    }

    this.logger.log(`Archivos reutilizados de caché: ${cachedCount}. Pendientes de calcular hash: ${pendingCalculation.length}`);

    // 5. Descargar y calcular SHA-1 para archivos nuevos o modificados en lotes concurrentes
    const BATCH_SIZE = 30;
    for (let i = 0; i < pendingCalculation.length; i += BATCH_SIZE) {
      const batch = pendingCalculation.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (blob) => {
          const rawUrl = `https://raw.githubusercontent.com/${cleanRepo}/${branch}/${encodeURI(blob.path)}`;
          try {
            const fileRes = await axios.get(rawUrl, {
              headers,
              responseType: 'arraybuffer',
              timeout: 20000,
            });
            const buffer = Buffer.from(fileRes.data);
            const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');

            resultFiles.push({
              path: blob.path,
              sha1,
              size: buffer.length,
              downloadUrl: `https://raw.githubusercontent.com/${cleanRepo}/${branch}/${blob.path}`,
            });
          } catch (fetchErr: any) {
            this.logger.warn(`No se pudo descargar o calcular hash para ${blob.path}: ${fetchErr.message}`);
          }
        }),
      );
    }

    // Ordenar alfabéticamente por ruta
    resultFiles.sort((a, b) => a.path.localeCompare(b.path));

    // 6. Detectar diferencias con respecto al manifest existente en GitHub
    const newFilePaths = new Set(resultFiles.map((f) => f.path));
    const addedFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const removedFiles: string[] = [];

    for (const f of resultFiles) {
      const prev = existingFileMap.get(f.path);
      if (!prev) {
        addedFiles.push(f.path);
      } else if (prev.sha1 !== f.sha1 || prev.size !== f.size) {
        modifiedFiles.push(f.path);
      }
    }

    for (const [prevPath] of existingFileMap) {
      if (!newFilePaths.has(prevPath)) {
        removedFiles.push(prevPath);
      }
    }

    const hasChanges = addedFiles.length > 0 || removedFiles.length > 0 || modifiedFiles.length > 0;
    
    // La versión de referencia nunca puede ser menor a la que ya existe en GitHub
    const existingVer = existingManifest?.version;
    const incomingVer = dto.version;
    const highestVer = maxSemver(existingVer, incomingVer);

    // Si hay cambios detectados, SIEMPRE incrementar sobre la versión más alta (nunca retroceder)
    let finalVersion = highestVer;
    if (hasChanges) {
      finalVersion = bumpVersion(highestVer, 'patch');
    }

    // Generar changelog descriptivo si hubo cambios y no se proveyó uno manual
    let generatedChangelog = dto.changelog;
    if (!generatedChangelog || generatedChangelog.length === 0) {
      if (hasChanges) {
        const changesLines: string[] = [];
        changesLines.push(`Actualización v${finalVersion} (${resultFiles.length} archivos)`);
        if (removedFiles.length > 0) {
          const removedNames = removedFiles.map((p) => p.split('/').pop() || p).slice(0, 5).join(', ');
          const extra = removedFiles.length > 5 ? ` y ${removedFiles.length - 5} más` : '';
          changesLines.push(`🗑️ Eliminado (${removedFiles.length}): ${removedNames}${extra}`);
        }
        if (addedFiles.length > 0) {
          const addedNames = addedFiles.map((p) => p.split('/').pop() || p).slice(0, 5).join(', ');
          const extra = addedFiles.length > 5 ? ` y ${addedFiles.length - 5} más` : '';
          changesLines.push(`➕ Agregado (${addedFiles.length}): ${addedNames}${extra}`);
        }
        if (modifiedFiles.length > 0) {
          const modNames = modifiedFiles.map((p) => p.split('/').pop() || p).slice(0, 5).join(', ');
          const extra = modifiedFiles.length > 5 ? ` y ${modifiedFiles.length - 5} más` : '';
          changesLines.push(`🔄 Actualizado (${modifiedFiles.length}): ${modNames}${extra}`);
        }
        generatedChangelog = changesLines;
      } else {
        generatedChangelog = existingManifest?.changelog || [
          `✨ Generación automática de manifiesto con ${resultFiles.length} archivos para ${cleanRepo}`,
        ];
      }
    }

    // 7. Calcular tamaño total y metadatos
    const totalBytes = resultFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    const totalSizeMb = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;

    const manifest = {
      name: dto.name || existingManifest?.name || cleanRepo.split('/')[1] || 'Chaos Modpack',
      version: finalVersion,
      minecraftVersion: dto.minecraftVersion || existingManifest?.minecraftVersion || '1.20.1',
      loader: {
        type: (dto.loaderType || existingManifest?.loader?.type || 'neoforge').toLowerCase(),
        version: dto.loaderVersion || existingManifest?.loader?.version || undefined,
      },
      server: dto.serverIp
        ? {
            ip: dto.serverIp,
            port: dto.serverPort || 25565,
          }
        : existingManifest?.server,
      recommendedRam: dto.recommendedRam || existingManifest?.recommendedRam || 6144,
      optionalMods: existingManifest?.optionalMods || [],
      downloadUrl: `https://raw.githubusercontent.com/${cleanRepo}/${branch}/modpack.json`,
      forceUpdate: dto.forceUpdate !== undefined ? dto.forceUpdate : (existingManifest?.forceUpdate ?? true),
      changelog: generatedChangelog,
      fileSizeMb: totalSizeMb,
      files: resultFiles,
    };

    return {
      success: true,
      manifest,
      previousVersion: existingManifest?.version || null,
      bumpedVersion: finalVersion,
      hasChanges,
      changesSummary: {
        added: addedFiles.length,
        removed: removedFiles.length,
        modified: modifiedFiles.length,
        addedFiles: addedFiles.slice(0, 10),
        removedFiles: removedFiles.slice(0, 10),
        modifiedFiles: modifiedFiles.slice(0, 10),
      },
      summary: {
        totalFiles: resultFiles.length,
        totalSizeMb,
        cachedFiles: cachedCount,
        newFiles: pendingCalculation.length,
        scope,
        repo: cleanRepo,
        branch,
      },
    };
  }

  /**
   * Publica el modpack.json directamente en el repositorio de GitHub mediante la API de GitHub,
   * y opcionalmente sincroniza de inmediato la base de datos de ChaosLauncher.
   */
  async pushManifest(dto: PushManifestDto, user: AuthUser) {
    const cleanRepo = normalizeGithubRepo(dto.repo);
    const branch = this.sanitizeBranch(dto.branch);
    const token = dto.githubToken.trim();

    if (!token) {
      throw new BadRequestException('Se requiere un Personal Access Token (PAT) de GitHub para realizar el commit.');
    }

    const headers = {
      'User-Agent': 'ChaosLauncher-Backend',
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${token}`,
    };

    // 1. Obtener el blob SHA del modpack.json existente si ya existe
    let existingSha: string | undefined;
    try {
      const getRes = await axios.get(`${this.apiUrl}/repos/${cleanRepo}/contents/modpack.json?ref=${branch}`, {
        headers,
        timeout: 60000,
      });
      if (getRes.data?.sha) {
        existingSha = getRes.data.sha;
      }
    } catch {
      // 404 significa que es la primera vez que se sube modpack.json al repo
    }

    // 2. Serializar el manifest a UTF-8 y codificar en Base64
    const contentString = JSON.stringify(dto.manifest, null, 2);
    const contentBase64 = Buffer.from(contentString, 'utf-8').toString('base64');

    const commitMessage =
      dto.commitMessage?.trim() ||
      `chore: update modpack.json v${dto.manifest?.version || '1.0.0'} via ChaosLauncher Studio`;

    const requestBody: Record<string, any> = {
      message: commitMessage,
      content: contentBase64,
      branch,
    };

    if (existingSha) {
      requestBody.sha = existingSha;
    }

    try {
      const putRes = await axios.put(`${this.apiUrl}/repos/${cleanRepo}/contents/modpack.json`, requestBody, {
        headers,
        timeout: 60000,
      });

      this.logger.log(`modpack.json subido con éxito a ${cleanRepo} (${branch}). Commit: ${putRes.data?.commit?.sha}`);

      // 3. Sincronizar inmediatamente la base de datos si se proporcionó un tag de modpack
      let synced = false;
      if (dto.modpackTag) {
        try {
          await new Promise((r) => setTimeout(r, 600)); // Esperar propagación en GitHub
          await this.syncModpackFromRepo(dto.modpackTag, user);
          synced = true;
        } catch (syncErr: any) {
          this.logger.warn(`No se pudo sincronizar automáticamente el tag ${dto.modpackTag}: ${syncErr.message}`);
        }
      }

      return {
        success: true,
        message: `¡modpack.json publicado con éxito en ${cleanRepo}!`,
        commitUrl: putRes.data?.commit?.html_url || `https://github.com/${cleanRepo}/commits/${branch}`,
        commitSha: putRes.data?.commit?.sha,
        synced,
      };
    } catch (err: any) {
      this.logger.error(`Error al subir modpack.json a GitHub: ${err.message}`);
      const githubMsg = err.response?.data?.message || err.message;
      throw new BadRequestException(
        `Error al subir a GitHub: ${githubMsg}. Verifica que tu token tenga permisos de escritura (repo o contents:write).`,
      );
    }
  }
}
