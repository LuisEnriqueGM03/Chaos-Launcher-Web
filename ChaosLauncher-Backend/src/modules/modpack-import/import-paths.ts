/**
 * Reglas de qué archivos de `overrides/` del ZIP se publican en el repositorio.
 * Se usa una lista blanca de carpetas (las mismas que sincroniza el launcher) más una lista negra de
 * archivos personales o generados en ejecución (logs, opciones del jugador, mapas, cachés…).
 */

/** Carpetas del juego que forman parte del modpack. */
export const MANAGED_DIRS = [
  'mods',
  'config',
  'defaultconfigs',
  'kubejs',
  'shaderpacks',
  'resourcepacks',
  'patchouli_books',
  'fancymenu_data',
] as const;

const EXCLUDED_FILE_NAMES = new Set([
  'options.txt',
  'optionsof.txt',
  'optionsshaders.txt',
  'servers.dat',
  'servers.dat_old',
  'usercache.json',
  'command_history.txt',
  'hotbar.nbt',
  '.ds_store',
  'thumbs.db',
]);

const EXCLUDED_SUFFIXES = ['.log', '.tmp', '.bak', '.lock', '.toml_backup'];

/** Rechaza rutas absolutas, con `..`, con `\` o con segmentos vacíos/ocultos peligrosos (zip-slip). */
export function isSafeZipPath(p: string): boolean {
  if (!p || p.startsWith('/') || p.includes('\\') ||/^[A-Za-z]:/.test(p)) return false;
  const parts = p.split('/');
  return !parts.some((seg, i) => seg === '..' || seg === '.' || (seg === '' && i !== parts.length - 1));
}

/** ¿Debe publicarse este archivo (ruta relativa a `overrides/`)? */
export function isManagedOverridePath(relPath: string): boolean {
  if (!isSafeZipPath(relPath) || relPath.endsWith('/')) return false;
  const top = relPath.split('/')[0];
  if (!(MANAGED_DIRS as readonly string[]).includes(top)) return false;
  const name = (relPath.split('/').pop() || '').toLowerCase();
  if (EXCLUDED_FILE_NAMES.has(name)) return false;
  if (EXCLUDED_SUFFIXES.some((s) => name.endsWith(s))) return false;
  return true;
}

/**
 * Los mods vienen de CurseForge (manifest.json), no del repositorio: no se publican los .jar de
 * `overrides/mods/` para no duplicarlos ni redistribuirlos.
 */
export function isOverrideMod(relPath: string): boolean {
  return relPath.startsWith('mods/') && /\.(jar|zip|disabled)$/i.test(relPath);
}
