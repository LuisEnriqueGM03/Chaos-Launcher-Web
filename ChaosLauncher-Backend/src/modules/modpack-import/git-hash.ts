import * as crypto from 'crypto';

/** SHA-1 de un blob de Git: sha1("blob <size>\0" + contenido). Permite comparar con el árbol del repo sin descargar. */
export function gitBlobSha(content: Buffer): string {
  const header = Buffer.from(`blob ${content.length}\0`);
  return crypto.createHash('sha1').update(header).update(content).digest('hex');
}

export function sha1Hex(content: Buffer): string {
  return crypto.createHash('sha1').update(content).digest('hex');
}
