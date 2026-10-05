import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuthUser {
  id: string;
  role: Role | string;
}

/**
 * Verifica que el usuario sea SUPERADMIN o el autor del modpack.
 * Los modpacks sin autor (legacy) solo los puede modificar un SUPERADMIN.
 */
export async function assertModpackOwner(prisma: PrismaService, tag: string, user: AuthUser) {
  const modpack = await prisma.modpack.findUnique({
    where: { tag },
    select: { authorId: true },
  });
  if (!modpack) {
    throw new NotFoundException(`Modpack "${tag}" no encontrado`);
  }
  if (user.role === Role.SUPERADMIN) return;
  if (!modpack.authorId || modpack.authorId !== user.id) {
    throw new ForbiddenException('Solo el autor del modpack o un superadmin puede modificarlo');
  }
}

/** Valida el formato "owner/repo" de GitHub (acepta URL completa). */
export function normalizeGithubRepo(raw: string): string {
  const clean = (raw || '')
    .trim()
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
  if (!/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(clean) || clean.includes('..')) {
    throw new BadRequestException('Repositorio de GitHub inválido (formato esperado: owner/repo)');
  }
  return clean;
}
