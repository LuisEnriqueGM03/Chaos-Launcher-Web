import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { assertModpackOwner, normalizeGithubRepo } from './ownership';

const prismaWith = (modpack: { authorId: string | null } | null) =>
  ({ modpack: { findUnique: jest.fn().mockResolvedValue(modpack) } }) as any;

describe('assertModpackOwner', () => {
  it('lanza NotFound si el modpack no existe', async () => {
    await expect(assertModpackOwner(prismaWith(null), 'x', { id: 'u1', role: 'CREATOR' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('permite al SUPERADMIN modificar cualquier modpack', async () => {
    await expect(assertModpackOwner(prismaWith({ authorId: 'otro' }), 'x', { id: 'admin', role: 'SUPERADMIN' })).resolves.toBeUndefined();
  });

  it('permite al autor', async () => {
    await expect(assertModpackOwner(prismaWith({ authorId: 'u1' }), 'x', { id: 'u1', role: 'CREATOR' })).resolves.toBeUndefined();
  });

  it('rechaza a otro creador', async () => {
    await expect(assertModpackOwner(prismaWith({ authorId: 'u1' }), 'x', { id: 'u2', role: 'CREATOR' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza a un creador si el modpack no tiene autor (legacy)', async () => {
    await expect(assertModpackOwner(prismaWith({ authorId: null }), 'x', { id: 'u1', role: 'CREATOR' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('normalizeGithubRepo', () => {
  it('acepta owner/repo y URL completa', () => {
    expect(normalizeGithubRepo('owner/repo')).toBe('owner/repo');
    expect(normalizeGithubRepo('https://github.com/owner/repo.git')).toBe('owner/repo');
    expect(normalizeGithubRepo('https://github.com/owner/repo/')).toBe('owner/repo');
  });

  it.each(['', 'solo-owner', '../../etc/passwd', 'a/b/c', 'owner/repo?x=1', 'owner/..', 'http://evil.com/a/b'])(
    'rechaza "%s"',
    (bad) => {
      expect(() => normalizeGithubRepo(bad)).toThrow(BadRequestException);
    },
  );
});
