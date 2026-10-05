export interface ParsedLoader {
  type: 'neoforge' | 'forge' | 'fabric' | 'quilt' | 'vanilla';
  version?: string;
}

/** "neoforge-21.1.248" → { type: 'neoforge', version: '21.1.248' }. */
export function parseLoader(id?: string): ParsedLoader {
  const match = /^(neoforge|forge|fabric|quilt)-(.+)$/i.exec((id || '').trim());
  if (!match) return { type: 'vanilla' };
  return { type: match[1].toLowerCase() as ParsedLoader['type'], version: match[2] };
}

/** "Mimic MC" → "mimic-mc" (cumple /^[a-z0-9-_]+$/ de CreateModpackDto.tag). */
export function slugify(name: string): string {
  return (
    (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'modpack'
  );
}

/** Ruta de un archivo en una URL raw de GitHub (codifica cada segmento). */
export function encodePath(p: string): string {
  return p.split('/').map(encodeURIComponent).join('/');
}

export interface FileChange {
  added: string[];
  modified: string[];
  removed: string[];
}

/** Líneas de changelog como las de GithubService.generateManifest. */
export function buildChangelog(version: string, total: number, c: FileChange): string[] {
  const names = (list: string[]) => {
    const shown = list.map((p) => p.split('/').pop() || p).slice(0, 5).join(', ');
    return list.length > 5 ? `${shown} y ${list.length - 5} más` : shown;
  };
  const lines = [`Actualización v${version} (${total} archivos)`];
  if (c.removed.length) lines.push(`🗑️ Eliminado (${c.removed.length}): ${names(c.removed)}`);
  if (c.added.length) lines.push(`➕ Agregado (${c.added.length}): ${names(c.added)}`);
  if (c.modified.length) lines.push(`🔄 Actualizado (${c.modified.length}): ${names(c.modified)}`);
  return lines;
}
