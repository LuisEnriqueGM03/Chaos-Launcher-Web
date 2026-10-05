import { ValidationPipe } from '@nestjs/common';
import { RegisterDto } from '../modules/auth/dto/register.dto';
import { AddVersionDto } from '../modules/manifests/dto/add-version.dto';
import { CreateModpackDto } from '../modules/modpacks/dto/create-modpack.dto';
import { ImportModpackDto } from '../modules/modpack-import/dto/import-modpack.dto';

// Misma configuración que main.ts
const pipe = new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } });
const run = (metatype: any, value: any) => pipe.transform(value, { type: 'body', metatype });

describe('RegisterDto', () => {
  it('descarta el campo role (no se puede auto-asignar SUPERADMIN)', async () => {
    const out: any = await run(RegisterDto, { username: 'steve', password: 'password123', role: 'SUPERADMIN' });
    expect(out.role).toBeUndefined();
    expect(out.username).toBe('steve');
  });

  it('rechaza contraseñas cortas', async () => {
    await expect(run(RegisterDto, { username: 'steve', password: '123' })).rejects.toBeDefined();
  });

  it('rechaza skinUrl que no sea https', async () => {
    await expect(run(RegisterDto, { username: 'steve', password: 'password123', skinUrl: 'javascript:alert(1)' })).rejects.toBeDefined();
  });
});

describe('AddVersionDto', () => {
  const sha1 = 'a'.repeat(40);

  it('acepta una versión válida', async () => {
    const out: any = await run(AddVersionDto, {
      version: '1.0.0',
      changelog: ['x'],
      files: [{ path: 'mods/a.jar', sha1, size: 10, downloadUrl: 'https://example.com/a.jar' }],
    });
    expect(out.files).toHaveLength(1);
  });

  it('rechaza downloadUrl http', async () => {
    await expect(
      run(AddVersionDto, { version: '1', changelog: [], files: [{ path: 'a', sha1, size: 1, downloadUrl: 'http://evil.com/a.jar' }] }),
    ).rejects.toBeDefined();
  });

  it('rechaza sha1 malformado', async () => {
    await expect(run(AddVersionDto, { version: '1', changelog: [], files: [{ path: 'a', sha1: 'zz', size: 1 }] })).rejects.toBeDefined();
  });
});

describe('tag del modpack (identificador compartido con el launcher)', () => {
  const base = { name: 'Mimic MC', serverIp: 'mimic.test', minecraftVersion: '1.21.1' };

  it('acepta un tag en minúsculas, números, guiones y guiones bajos', async () => {
    const out: any = await run(CreateModpackDto, { ...base, tag: 'mimic-pm_2' });
    expect(out.tag).toBe('mimic-pm_2');
  });

  it('rechaza mayúsculas, espacios y puntos (el launcher los convertiría en otra carpeta)', async () => {
    for (const tag of ['Mimic-PM', 'mimic pm', 'mimic.pm']) {
      await expect(run(CreateModpackDto, { ...base, tag })).rejects.toBeDefined();
    }
  });

  it('rechaza tags de más de 64 caracteres (el launcher no los aceptaría)', async () => {
    await expect(run(CreateModpackDto, { ...base, tag: 'a'.repeat(65) })).rejects.toBeDefined();
    await expect(run(CreateModpackDto, { ...base, tag: 'a'.repeat(64) })).resolves.toBeDefined();
  });

  it('la importación aplica el mismo límite al tag de un modpack existente', async () => {
    await expect(run(ImportModpackDto, { githubToken: 'x', modpackTag: 'a'.repeat(65) })).rejects.toBeDefined();
  });
});
