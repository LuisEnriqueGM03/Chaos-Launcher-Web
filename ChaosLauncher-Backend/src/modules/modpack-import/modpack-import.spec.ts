import { gitBlobSha, sha1Hex } from './git-hash';
import { diffTrees } from './import-diff';
import { isManagedOverridePath, isOverrideMod, isSafeZipPath } from './import-paths';
import { buildChangelog, encodePath, parseLoader, slugify } from './manifest-utils';
import { forgeCdnUrl } from './curseforge.service';

describe('isSafeZipPath', () => {
  it('acepta rutas relativas normales', () => {
    expect(isSafeZipPath('config/mod.toml')).toBe(true);
    expect(isSafeZipPath('resourcepacks/Pack Name.zip')).toBe(true);
  });

  it('rechaza zip-slip, rutas absolutas y barras invertidas', () => {
    expect(isSafeZipPath('../evil.txt')).toBe(false);
    expect(isSafeZipPath('config/../../evil.txt')).toBe(false);
    expect(isSafeZipPath('/etc/passwd')).toBe(false);
    expect(isSafeZipPath('C:/Windows/x.dll')).toBe(false);
    expect(isSafeZipPath('config\\x.toml')).toBe(false);
    expect(isSafeZipPath('')).toBe(false);
  });
});

describe('isManagedOverridePath', () => {
  it('publica solo las carpetas del modpack', () => {
    expect(isManagedOverridePath('config/ae2/common.toml')).toBe(true);
    expect(isManagedOverridePath('resourcepacks/pack/pack.mcmeta')).toBe(true);
    expect(isManagedOverridePath('shaderpacks/Eclipse.zip')).toBe(true);
    expect(isManagedOverridePath('kubejs/server_scripts/a.js')).toBe(true);
  });

  it('excluye logs, mapas, datos del jugador y carpetas ajenas', () => {
    expect(isManagedOverridePath('logs/latest.log')).toBe(false);
    expect(isManagedOverridePath('xaero/worldmap/x.zip')).toBe(false);
    expect(isManagedOverridePath('local/crash_assistant/x.jar')).toBe(false);
    expect(isManagedOverridePath('options.txt')).toBe(false);
    expect(isManagedOverridePath('servers.dat')).toBe(false);
    expect(isManagedOverridePath('config/options.txt')).toBe(false);
    expect(isManagedOverridePath('config/mod.toml.bak')).toBe(false);
    expect(isManagedOverridePath('config/debug.log')).toBe(false);
    expect(isManagedOverridePath('config/')).toBe(false);
    expect(isManagedOverridePath('config/../x')).toBe(false);
  });
});

describe('isOverrideMod', () => {
  it('detecta jars dentro de overrides/mods', () => {
    expect(isOverrideMod('mods/a.jar')).toBe(true);
    expect(isOverrideMod('mods/readme.txt')).toBe(false);
    expect(isOverrideMod('config/a.jar')).toBe(false);
  });
});

describe('gitBlobSha', () => {
  it('coincide con git hash-object', () => {
    // printf 'hello' | git hash-object --stdin
    expect(gitBlobSha(Buffer.from('hello'))).toBe('b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0');
    // archivo vacío
    expect(gitBlobSha(Buffer.alloc(0))).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
  });

  it('sha1Hex es el SHA-1 normal del contenido', () => {
    expect(sha1Hex(Buffer.from('hello'))).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });
});

describe('diffTrees', () => {
  const removable = (p: string) => p.startsWith('config/');

  it('detecta añadidos, modificados, sin cambios y eliminados', () => {
    const local = new Map([
      ['config/a.toml', 's1'],
      ['config/b.toml', 's2-nuevo'],
      ['config/c.toml', 's3'],
    ]);
    const remote = new Map([
      ['config/a.toml', 's1'],
      ['config/b.toml', 's2'],
      ['config/old.toml', 'x'],
      ['README.md', 'r'],
      ['modpack.json', 'm'],
    ]);
    const d = diffTrees(local, remote, removable);
    expect(d.unchanged).toEqual(['config/a.toml']);
    expect(d.modified).toEqual(['config/b.toml']);
    expect(d.added).toEqual(['config/c.toml']);
    expect(d.removed).toEqual(['config/old.toml']);
  });

  it('nunca borra README, modpack.json ni archivos fuera de las carpetas gestionadas', () => {
    const d = diffTrees(new Map(), new Map([['README.md', 'r'], ['modpack.json', 'm'], ['otra/cosa.txt', 'o']]), removable);
    expect(d.removed).toEqual([]);
  });

  it('un ZIP idéntico no produce cambios', () => {
    const m = new Map([['config/a.toml', 's1']]);
    const d = diffTrees(m, new Map(m), removable);
    expect(d.added.length + d.modified.length + d.removed.length).toBe(0);
  });
});

describe('manifest-utils', () => {
  it('parseLoader', () => {
    expect(parseLoader('neoforge-21.1.248')).toEqual({ type: 'neoforge', version: '21.1.248' });
    expect(parseLoader('forge-47.2.0')).toEqual({ type: 'forge', version: '47.2.0' });
    expect(parseLoader('fabric-0.15.11')).toEqual({ type: 'fabric', version: '0.15.11' });
    expect(parseLoader('')).toEqual({ type: 'vanilla' });
  });

  it('slugify cumple el patrón del tag', () => {
    expect(slugify('Mimic MC')).toBe('mimic-mc');
    expect(slugify('  Ñandú Craft!! 2  ')).toBe('nandu-craft-2');
    expect(slugify('***')).toBe('modpack');
    expect(slugify('Mimic MC')).toMatch(/^[a-z0-9-_]+$/);
  });

  it('encodePath codifica cada segmento pero conserva las barras', () => {
    expect(encodePath('resourcepacks/Refreshing Soundtracks!.zip')).toBe('resourcepacks/Refreshing%20Soundtracks!.zip');
  });

  it('buildChangelog resume los cambios', () => {
    const lines = buildChangelog('1.0.1', 10, { added: ['mods/a.jar'], modified: ['config/b.toml'], removed: [] });
    expect(lines[0]).toBe('Actualización v1.0.1 (10 archivos)');
    expect(lines.some((l) => l.includes('Agregado (1): a.jar'))).toBe(true);
    expect(lines.some((l) => l.includes('Actualizado (1): b.toml'))).toBe(true);
    expect(lines.some((l) => l.includes('Eliminado'))).toBe(false);
  });

  it('forgeCdnUrl sigue el esquema del CDN de CurseForge', () => {
    expect(forgeCdnUrl(8242804, 'Mod Name-1.0.jar')).toBe(
      'https://edge.forgecdn.net/files/8242/804/Mod%20Name-1.0.jar',
    );
  });
});
