import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AuthUser } from '../../common/utils/ownership';

/** Tamaño máximo de una parte. Cloudflare rechaza peticiones de más de 100 MB, así que el cliente envía partes menores. */
export const MAX_CHUNK_BYTES = 64 * 1024 * 1024;
export const MAX_ZIP_BYTES = 1024 * 1024 * 1024;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

interface UploadSession {
  id: string;
  userId: string;
  size: number;
  received: number;
  nextIndex: number;
  filePath: string;
  timer: NodeJS.Timeout;
}

/**
 * Recibe un ZIP grande en partes consecutivas y lo ensambla en un archivo temporal.
 * Evita el límite de tamaño por petición de proxies como Cloudflare y los fallos de una sola subida muy larga.
 */
@Injectable()
export class ChunkedUploadService {
  private readonly logger = new Logger(ChunkedUploadService.name);
  private readonly sessions = new Map<string, UploadSession>();

  init(user: AuthUser, fileName: string, size: number): { uploadId: string; chunkSize: number } {
    if (path.extname(fileName || '').toLowerCase() !== '.zip') {
      throw new BadRequestException('El archivo debe ser un .zip');
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_ZIP_BYTES) {
      throw new BadRequestException(`Tamaño de ZIP inválido (máximo ${MAX_ZIP_BYTES / 1048576} MB).`);
    }
    const id = randomUUID();
    const filePath = path.join(os.tmpdir(), `chaos-import-${id}.zip`);
    fs.writeFileSync(filePath, Buffer.alloc(0));
    const timer = setTimeout(() => this.discard(id), SESSION_TTL_MS);
    timer.unref?.();
    this.sessions.set(id, { id, userId: user.id, size, received: 0, nextIndex: 0, filePath, timer });
    return { uploadId: id, chunkSize: 32 * 1024 * 1024 };
  }

  private get(id: string, user: AuthUser): UploadSession {
    const s = this.sessions.get(id);
    if (!s) throw new NotFoundException('La subida no existe o caducó. Vuelve a empezar.');
    if (s.userId !== user.id) throw new ForbiddenException('Esta subida pertenece a otro usuario.');
    return s;
  }

  /** Añade la parte `index`. Es idempotente: reenviar una parte ya recibida no la duplica. */
  async appendChunk(id: string, user: AuthUser, index: number, data: Buffer): Promise<{ received: number }> {
    const s = this.get(id, user);
    if (!Number.isInteger(index) || index < 0) throw new BadRequestException('Índice de parte inválido.');
    if (index < s.nextIndex) return { received: s.received };
    if (index > s.nextIndex) {
      throw new BadRequestException(`Falta la parte ${s.nextIndex}; las partes deben enviarse en orden.`);
    }
    if (data.length === 0) throw new BadRequestException('La parte está vacía.');
    if (s.received + data.length > s.size) {
      throw new BadRequestException('Se recibieron más bytes de los anunciados.');
    }
    await fs.promises.appendFile(s.filePath, data);
    s.received += data.length;
    s.nextIndex++;
    return { received: s.received };
  }

  /** Verifica que llegó todo y entrega la ruta del ZIP ensamblado (a partir de aquí lo gestiona el trabajo de importación). */
  complete(id: string, user: AuthUser): string {
    const s = this.get(id, user);
    if (s.received !== s.size) {
      throw new BadRequestException(`El ZIP está incompleto (${s.received} de ${s.size} bytes).`);
    }
    clearTimeout(s.timer);
    this.sessions.delete(id);
    return s.filePath;
  }

  discard(id: string): void {
    const s = this.sessions.get(id);
    if (!s) return;
    clearTimeout(s.timer);
    this.sessions.delete(id);
    fs.promises.unlink(s.filePath).catch(() => undefined);
    this.logger.log(`Subida ${id} descartada.`);
  }
}
