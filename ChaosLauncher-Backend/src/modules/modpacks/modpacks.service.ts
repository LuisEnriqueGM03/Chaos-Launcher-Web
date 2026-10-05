import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { CreateModpackDto } from './dto/create-modpack.dto';
import { UpdateModpackDto } from './dto/update-modpack.dto';
import { ModConfigItemDto } from './dto/optional-mod-config.dto';

import { GithubService } from '../github/github.service';

import { assertModpackOwner, AuthUser } from '../../common/utils/ownership';

@Injectable()
export class ModpacksService {
  private readonly logger = new Logger(ModpacksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.modpack.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        author: {
          select: { id: true, username: true, role: true, skinUrl: true },
        },
        optionalMods: true,
        versions: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });
  }

  async refreshAll() {
    this.logger.log('Refrescando y sincronizando catálogo de modpacks con repositorios remotos...');
    try {
      const activeModpacks = await this.prisma.modpack.findMany({
        where: { isActive: true },
      });

      for (const m of activeModpacks) {
        if (m.githubRepo) {
          try {
            await this.githubService.syncModpackFromRepo(m.tag);
          } catch (syncErr: any) {
            this.logger.warn(`No se pudo sincronizar automáticamente modpack "${m.tag}" desde GitHub: ${syncErr.message}`);
          }
        }
      }
    } catch (e: any) {
      this.logger.warn(`Error al verificar sincronización con GitHub: ${e.message}`);
    }

    return this.findAll(false);
  }

  async findOneByTag(tag: string) {
    const modpack = await this.prisma.modpack.findUnique({
      where: { tag },
      include: {
        author: {
          select: { id: true, username: true, role: true, skinUrl: true },
        },
        optionalMods: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { files: true },
        },
      },
    });

    if (!modpack) {
      throw new NotFoundException(`Modpack con tag "${tag}" no fue encontrado.`);
    }

    return modpack;
  }

  async create(dto: CreateModpackDto, authorId?: string) {
    const existing = await this.prisma.modpack.findUnique({
      where: { tag: dto.tag },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un modpack con el tag "${dto.tag}".`);
    }

    const { optionalMods, changelog, ...modpackData } = dto;

    return this.prisma.modpack.create({
      data: {
        ...modpackData,
        authorId: authorId || undefined,
        versions: {
          create: {
            version: dto.version || '1.0.0',
            changelog: changelog || [],
            isCurrent: true,
          },
        },
        optionalMods: optionalMods && optionalMods.length > 0
          ? {
              create: optionalMods.map((mod) => ({
                modId: mod.modId,
                name: mod.name,
                file: mod.file,
                description: mod.description || '',
                defaultEnabled: mod.defaultEnabled ?? true,
              })),
            }
          : undefined,
      },
      include: {
        versions: true,
        optionalMods: true,
      },
    });
  }

  async update(tag: string, dto: UpdateModpackDto, user: AuthUser) {
    await assertModpackOwner(this.prisma, tag, user);
    const modpack = await this.findOneByTag(tag);

    // El tag es la identidad del modpack: el launcher lo usa como carpeta y para recordar la versión instalada.
    // Cambiarlo dejaría huérfana la instalación de todos los jugadores, así que es inmutable.
    const { optionalMods, changelog, tag: requestedTag, ...modpackData } = dto;
    if (requestedTag !== undefined && requestedTag !== modpack.tag) {
      throw new BadRequestException(
        `El tag de un modpack no se puede cambiar (actual: "${modpack.tag}"). Crea un modpack nuevo si necesitas otro identificador.`,
      );
    }

    // Si se pasa una versión nueva diferente a la actual
    if (dto.version && dto.version !== modpack.version) {
      await this.prisma.modpackVersion.updateMany({
        where: { modpackId: modpack.id },
        data: { isCurrent: false },
      });

      await this.prisma.modpackVersion.create({
        data: {
          modpackId: modpack.id,
          version: dto.version,
          changelog: changelog || [],
          isCurrent: true,
        },
      });
    } else if (changelog) {
      // Si solo se actualiza el changelog de la versión actual
      const currentVersion = await this.prisma.modpackVersion.findFirst({
        where: { modpackId: modpack.id, isCurrent: true },
        orderBy: { createdAt: 'desc' },
      });

      if (currentVersion) {
        await this.prisma.modpackVersion.update({
          where: { id: currentVersion.id },
          data: { changelog },
        });
      } else {
        await this.prisma.modpackVersion.create({
          data: {
            modpackId: modpack.id,
            version: modpack.version,
            changelog,
            isCurrent: true,
          },
        });
      }
    }

    // Actualizar mods opcionales si se proporcionaron
    if (optionalMods) {
      await this.prisma.optionalMod.deleteMany({
        where: { modpackId: modpack.id },
      });

      if (optionalMods.length > 0) {
        await this.prisma.optionalMod.createMany({
          data: optionalMods.map((mod) => ({
            modpackId: modpack.id,
            modId: mod.modId,
            name: mod.name,
            file: mod.file,
            description: mod.description || '',
            defaultEnabled: mod.defaultEnabled ?? true,
          })),
        });
      }
    }

    return this.prisma.modpack.update({
      where: { id: modpack.id },
      data: modpackData,
      include: {
        versions: { where: { isCurrent: true } },
        optionalMods: true,
      },
    });
  }

  async remove(tag: string, user: AuthUser) {
    await assertModpackOwner(this.prisma, tag, user);
    const modpack = await this.findOneByTag(tag);
    return this.prisma.modpack.delete({
      where: { id: modpack.id },
    });
  }

  async inspectSourceMods(tag: string, user: AuthUser) {
    await assertModpackOwner(this.prisma, tag, user);
    const modpack = await this.findOneByTag(tag);

    // 1. Resolver URL del modpack.json
    let sourceUrl = modpack.downloadUrl;
    if (!sourceUrl || !sourceUrl.endsWith('.json')) {
      if (modpack.githubRepo) {
        const repoClean = modpack.githubRepo.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
        const branch = modpack.githubBranch || 'main';
        sourceUrl = `https://raw.githubusercontent.com/${repoClean}/${branch}/modpack.json`;
      }
    }

    if (!sourceUrl) {
      throw new BadRequestException(
        `El modpack "${tag}" no tiene un repositorio de GitHub ni downloadUrl válida para consultar el modpack.json.`,
      );
    }

    // 2. Descargar y parsear el modpack.json
    let files: Array<{ path: string; size?: number; sha1?: string }> = [];
    try {
      const response = await axios.get(sourceUrl, { timeout: 15000 });
      const data = response.data;
      if (Array.isArray(data.files)) {
        files = data.files;
      } else if (Array.isArray(data)) {
        files = data;
      }
    } catch (err: any) {
      this.logger.error(`Error al descargar modpack.json desde ${sourceUrl}: ${err.message}`);
      throw new BadRequestException(
        `No se pudo leer modpack.json desde ${sourceUrl}: ${err.message}`,
      );
    }

    // 3. Filtrar archivos que sean mods (.jar en carpeta mods)
    const modFiles = files.filter(
      (f) =>
        f.path &&
        (f.path.startsWith('mods/') || f.path.startsWith('mods\\') || f.path.toLowerCase().endsWith('.jar')),
    );

    // 4. Mapear y cruzar con los mods opcionales ya guardados en BD
    const currentOptionalMods = modpack.optionalMods || [];

    const results = modFiles.map((fileEntry) => {
      const fileName = path.basename(fileEntry.path);
      const cleanName = this.humanizeModName(fileName);
      const modId = this.sanitizeModId(cleanName);

      const existing = currentOptionalMods.find(
        (m) => m.file.toLowerCase() === fileName.toLowerCase() || m.modId === modId,
      );

      return {
        file: fileName,
        path: fileEntry.path,
        modId: existing?.modId || modId,
        name: existing?.name || cleanName,
        description: existing?.description || '',
        defaultEnabled: existing ? existing.defaultEnabled : true,
        isOptional: Boolean(existing),
        size: fileEntry.size || 0,
        sha1: fileEntry.sha1 || '',
      };
    });

    return {
      modpackTag: modpack.tag,
      modpackName: modpack.name,
      sourceUrl,
      totalMods: results.length,
      configuredCount: results.filter((r) => r.isOptional).length,
      mods: results,
    };
  }

  async updateOptionalMods(tag: string, mods: ModConfigItemDto[], user: AuthUser) {
    await assertModpackOwner(this.prisma, tag, user);
    const modpack = await this.findOneByTag(tag);

    return this.prisma.$transaction(async (tx) => {
      // 1. Eliminar anteriores
      await tx.optionalMod.deleteMany({
        where: { modpackId: modpack.id },
      });

      // 2. Insertar nuevos mods configurados
      if (mods && mods.length > 0) {
        await tx.optionalMod.createMany({
          data: mods.map((m) => ({
            modpackId: modpack.id,
            modId: m.modId || this.sanitizeModId(m.name),
            name: m.name,
            file: m.file,
            description: m.description || '',
            defaultEnabled: m.defaultEnabled ?? true,
          })),
        });
      }

      // 3. Retornar lista completa actualizada
      return tx.optionalMod.findMany({
        where: { modpackId: modpack.id },
        orderBy: { name: 'asc' },
      });
    });
  }

  private humanizeModName(fileName: string): string {
    let name = fileName.replace(/\.jar$/i, '').replace(/\.disabled$/i, '');
    // Remover prefijos de versión de Minecraft o modloader comunes
    name = name.replace(/^\d+\.\d+(\.\d+)?(-|_)/i, '');
    name = name.replace(/^(neoforge|fabric|forge)(-|_)/i, '');
    name = name.replace(/-(neoforge|fabric|forge).*$/i, '');
    name = name.replace(/(-|_)\d+\.\d+.*$/i, '');
    name = name.replace(/\+mc\d+\.\d+.*$/i, '');
    // Reemplazar guiones y guiones bajos por espacios
    name = name.replace(/[-_]+/g, ' ').trim();
    // Capitalizar palabras
    return name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || fileName;
  }

  private sanitizeModId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

