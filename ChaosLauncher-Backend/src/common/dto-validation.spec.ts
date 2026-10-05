import { ValidationPipe } from '@nestjs/common';
import { RegisterDto } from '../modules/auth/dto/register.dto';
import { AddVersionDto } from '../modules/manifests/dto/add-version.dto';

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
