import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface LauncherManifestFileEntry {
  path: string;
  sha1: string;
  size: number;
  downloadUrl?: string;
  parts?: string[];
}

export interface LauncherManifest {
  tag?: string;
  name: string;
  githubRepo?: string;
  githubBranch?: string;
  version: string;
  minecraftVersion: string;
  loader: {
    type: 'vanilla' | 'fabric' | 'forge' | 'neoforge';
    version?: string;
  };
  server?: {
    ip: string;
    port: number;
  };
  recommendedRam?: number;
  optionalMods?: Array<{
    id: string;
    name: string;
    file: string;
    description: string;
    defaultEnabled: boolean;
  }>;
  downloadUrl?: string;
  forceUpdate?: boolean;
  hasOptionalMods?: boolean;
  hasRules?: boolean;
  rulesContent?: string;
  hasDiscord?: boolean;
  discordUrl?: string;
  hasChangelog?: boolean;
  changelog: string[];
  fileSizeMb?: number;
  sha1?: string;
  files?: LauncherManifestFileEntry[];
}

import { assertModpackOwner, AuthUser } from '../../common/utils/ownership';
import { AddVersionDto } from './dto/add-version.dto';

@Injectable()
export class ManifestsService {
  constructor(private readonly prisma: PrismaService) {}

  async getManifest(tag: string): Promise<LauncherManifest> {
    const modpack = await this.prisma.modpack.findUnique({
      where: { tag },
      include: {
        optionalMods: true,
        versions: {
          where: { isCurrent: true },
          include: { files: true },
          take: 1,
        },
      },
    });

    if (!modpack) {
      throw new NotFoundException(`Modpack con tag "${tag}" no fue encontrado.`);
    }

    const currentVersion = modpack.versions[0];

    const files: LauncherManifestFileEntry[] = currentVersion?.files?.map((f) => ({
      path: f.path,
      sha1: f.sha1,
      size: f.size,
      downloadUrl: f.downloadUrl || undefined,
    })) || [];

    const rawGithubUrl = modpack.githubRepo
      ? `https://raw.githubusercontent.com/${modpack.githubRepo}/${modpack.githubBranch || 'main'}/modpack.json`
      : undefined;

    const manifest: LauncherManifest = {
      tag: modpack.tag,
      name: modpack.name,
      githubRepo: modpack.githubRepo || undefined,
      githubBranch: modpack.githubBranch || undefined,
      version: currentVersion?.version || modpack.version,
      minecraftVersion: modpack.minecraftVersion,
      loader: {
        type: modpack.loaderType.toLowerCase() as any,
        version: modpack.loaderVersion || undefined,
      },
      server: {
        ip: modpack.serverIp,
        port: modpack.serverPort,
      },
      recommendedRam: modpack.recommendedRam,
      optionalMods: modpack.optionalMods.map((m) => ({
        id: m.modId,
        name: m.name,
        file: m.file,
        description: m.description,
        defaultEnabled: m.defaultEnabled,
      })),
      downloadUrl: modpack.downloadUrl || rawGithubUrl || undefined,
      forceUpdate: modpack.forceUpdate,
      hasOptionalMods: modpack.hasOptionalMods,
      hasRules: modpack.hasRules,
      rulesContent: modpack.rulesContent || undefined,
      hasDiscord: modpack.hasDiscord,
      discordUrl: modpack.discordUrl || undefined,
      hasChangelog: modpack.hasChangelog,
      changelog: currentVersion?.changelog || [],
      fileSizeMb: currentVersion?.fileSizeMb || undefined,
      sha1: currentVersion?.sha1 || undefined,
      files: files.length > 0 ? files : undefined,
    };

    return manifest;
  }

  async addVersion(tag: string, data: AddVersionDto, user: AuthUser) {
    await assertModpackOwner(this.prisma, tag, user);
    const modpack = await this.prisma.modpack.findUnique({
      where: { tag },
    });

    if (!modpack) {
      throw new NotFoundException(`Modpack "${tag}" no encontrado`);
    }

    // Marcar versiones anteriores como no actuales
    await this.prisma.modpackVersion.updateMany({
      where: { modpackId: modpack.id },
      data: { isCurrent: false },
    });

    // Crear la nueva versión y sus archivos
    const newVersion = await this.prisma.modpackVersion.create({
      data: {
        modpackId: modpack.id,
        version: data.version,
        changelog: data.changelog,
        fileSizeMb: data.fileSizeMb,
        sha1: data.sha1,
        isCurrent: true,
        files: data.files && data.files.length > 0
          ? {
              create: data.files.map((f) => ({
                path: f.path,
                sha1: f.sha1,
                size: f.size,
                downloadUrl: f.downloadUrl,
              })),
            }
          : undefined,
      },
      include: { files: true },
    });

    // Actualizar versión principal del modpack
    await this.prisma.modpack.update({
      where: { id: modpack.id },
      data: {
        version: data.version,
        forceUpdate: data.forceUpdate !== undefined ? data.forceUpdate : modpack.forceUpdate,
      },
    });

    return newVersion;
  }
}
