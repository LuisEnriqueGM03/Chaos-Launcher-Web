import { BadRequestException } from '@nestjs/common';
import { ModpacksService } from './modpacks.service';

describe('ModpacksService.update: el tag es inmutable', () => {
  const existing = { id: 'uuid-1', tag: 'mimic-pm', version: '1.0.0', authorId: 'u1', versions: [], optionalMods: [] };
  const admin = { id: 'u1', role: 'SUPERADMIN' };

  const build = () => {
    const prisma: any = {
      modpack: {
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(existing),
      },
      modpackVersion: { updateMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      optionalMod: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    return { prisma, service: new ModpacksService(prisma, {} as any) };
  };

  it('rechaza cambiar el tag (el launcher usa el tag como carpeta de instalación)', async () => {
    const { service, prisma } = build();
    await expect(service.update('mimic-pm', { tag: 'otro-tag' } as any, admin)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.modpack.update).not.toHaveBeenCalled();
  });

  it('acepta reenviar el mismo tag (el front lo manda al editar) sin intentar escribirlo', async () => {
    const { service, prisma } = build();
    await service.update('mimic-pm', { tag: 'mimic-pm', name: 'Nuevo nombre' } as any, admin);
    expect(prisma.modpack.update).toHaveBeenCalledTimes(1);
    const data = prisma.modpack.update.mock.calls[0][0].data;
    expect(data.name).toBe('Nuevo nombre');
    expect(data).not.toHaveProperty('tag');
  });
});
