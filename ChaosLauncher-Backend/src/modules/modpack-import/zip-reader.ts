import * as yauzl from 'yauzl';

export const MAX_ENTRIES = 60000;
export const MAX_ENTRY_BYTES = 600 * 1024 * 1024;

export type ReadEntry = () => Promise<Buffer>;

/**
 * Recorre las entradas del ZIP una a una sin cargarlo en memoria (lectura aleatoria con yauzl).
 * `onEntry` se espera antes de pasar a la siguiente, así que puede hacer trabajo asíncrono (p. ej. subir un lote).
 */
export function iterateZip(
  zipPath: string,
  onEntry: (entry: yauzl.Entry, read: ReadEntry) => Promise<void>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (err, zip) => {
      if (err || !zip) return reject(err || new Error('No se pudo abrir el ZIP'));
      if (zip.entryCount > MAX_ENTRIES) {
        zip.close();
        return reject(new Error(`El ZIP tiene demasiados archivos (${zip.entryCount}).`));
      }

      const makeReader =
        (entry: yauzl.Entry): ReadEntry =>
        () =>
          new Promise<Buffer>((res, rej) => {
            if (entry.uncompressedSize > MAX_ENTRY_BYTES) {
              return rej(new Error(`El archivo ${entry.fileName} es demasiado grande.`));
            }
            zip.openReadStream(entry, (e, stream) => {
              if (e || !stream) return rej(e || new Error('No se pudo leer la entrada'));
              const chunks: Buffer[] = [];
              stream.on('data', (c: Buffer) => chunks.push(c));
              stream.on('end', () => res(Buffer.concat(chunks)));
              stream.on('error', rej);
            });
          });

      zip.on('entry', (entry: yauzl.Entry) => {
        onEntry(entry, makeReader(entry)).then(
          () => zip.readEntry(),
          (e) => {
            zip.close();
            reject(e);
          },
        );
      });
      zip.on('end', () => resolve());
      zip.on('error', reject);
      zip.readEntry();
    });
  });
}

/** Lee una sola entrada por nombre exacto (null si no existe). */
export async function readZipEntry(zipPath: string, name: string): Promise<Buffer | null> {
  let found: Buffer | null = null;
  await iterateZip(zipPath, async (entry, read) => {
    if (entry.fileName === name) found = await read();
  });
  return found;
}
