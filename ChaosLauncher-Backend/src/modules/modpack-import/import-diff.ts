export interface TreeDiff {
  added: string[];
  modified: string[];
  removed: string[];
  unchanged: string[];
}

/**
 * Compara los archivos locales (ruta → git blob sha) con los del repo.
 * `removable` decide qué rutas del repo pueden borrarse (nunca README, modpack.json ni carpetas ajenas al modpack).
 */
export function diffTrees(
  local: Map<string, string>,
  remote: Map<string, string>,
  removable: (path: string) => boolean,
): TreeDiff {
  const diff: TreeDiff = { added: [], modified: [], removed: [], unchanged: [] };
  for (const [path, sha] of local) {
    const prev = remote.get(path);
    if (prev === undefined) diff.added.push(path);
    else if (prev !== sha) diff.modified.push(path);
    else diff.unchanged.push(path);
  }
  for (const path of remote.keys()) {
    if (!local.has(path) && removable(path)) diff.removed.push(path);
  }
  return diff;
}
