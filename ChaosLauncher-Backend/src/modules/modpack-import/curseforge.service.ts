import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ResolvedMod {
  fileId: number;
  modId: number;
  fileName: string;
  size: number;
  sha1: string;
  downloadUrl: string;
}

const API = 'https://api.curseforge.com/v1';
const BATCH = 100;

/** CDN público de CurseForge; sirve cuando el autor desactiva `downloadUrl` en la API. */
export function forgeCdnUrl(fileId: number, fileName: string): string {
  return `https://edge.forgecdn.net/files/${Math.floor(fileId / 1000)}/${fileId % 1000}/${encodeURIComponent(fileName)}`;
}

@Injectable()
export class CurseForgeService {
  private readonly logger = new Logger(CurseForgeService.name);
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('curseforge.apiKey') || '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /** Resuelve nombre, hash y URL de descarga de cada fileId. Los que no se puedan resolver quedan fuera del Map. */
  async resolveFiles(fileIds: number[]): Promise<Map<number, ResolvedMod>> {
    const out = new Map<number, ResolvedMod>();
    for (let i = 0; i < fileIds.length; i += BATCH) {
      const batch = fileIds.slice(i, i + BATCH);
      let data: any[] = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await axios.post(
            `${API}/mods/files`,
            { fileIds: batch },
            { headers: { 'x-api-key': this.apiKey, Accept: 'application/json' }, timeout: 30000 },
          );
          data = res.data?.data || [];
          break;
        } catch (err: any) {
          this.logger.warn(`CurseForge lote ${i / BATCH + 1}, intento ${attempt}: ${err.message}`);
          if (attempt === 3) {
            throw new Error(`No se pudo consultar CurseForge: ${err.response?.data?.message || err.message}`);
          }
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
      for (const f of data) {
        const sha1 = (f.hashes || []).find((h: any) => h.algo === 1)?.value;
        if (!f.id || !f.fileName || !sha1) continue;
        out.set(f.id, {
          fileId: f.id,
          modId: f.modId,
          fileName: f.fileName,
          size: f.fileLength || 0,
          sha1,
          downloadUrl: f.downloadUrl || forgeCdnUrl(f.id, f.fileName),
        });
      }
    }
    return out;
  }
}
