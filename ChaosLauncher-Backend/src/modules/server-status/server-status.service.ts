import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';

export interface ServerStatusResult {
  online: boolean;
  players: number;
  max: number;
  motd?: string;
  ip: string;
  port: number;
  cached: boolean;
  checkedAt: string;
}

interface CacheEntry {
  data: ServerStatusResult;
  expiresAt: number;
}

@Injectable()
export class ServerStatusService {
  private readonly logger = new Logger(ServerStatusService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const ttlSeconds = this.configService.get<number>('serverStatus.cacheTtlSeconds') || 30;
    this.cacheTtlMs = ttlSeconds * 1000;
  }

  async getStatusForModpack(tag: string): Promise<ServerStatusResult> {
    const modpack = await this.prisma.modpack.findUnique({
      where: { tag },
      select: { serverIp: true, serverPort: true },
    });

    if (!modpack?.serverIp) {
      throw new NotFoundException(`El modpack "${tag}" no existe o no tiene servidor configurado.`);
    }
    const ip = modpack.serverIp;
    const port = modpack.serverPort || 25565;

    return this.pingServer(ip, port);
  }

  async pingServer(ip: string, port = 25565): Promise<ServerStatusResult> {
    const cacheKey = `${ip}:${port}`;
    const now = Date.now();

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return {
        ...cached.data,
        cached: true,
      };
    }

    try {
      const url = `https://api.mcsrvstat.us/3/${encodeURIComponent(ip)}:${port}`;
      const response = await axios.get(url, { timeout: 6000 });
      const data = response.data;

      const result: ServerStatusResult = {
        online: Boolean(data?.online),
        players: data?.players?.online || 0,
        max: data?.players?.max || 20,
        motd: data?.motd?.clean?.join(' ') || data?.motd?.raw?.join(' ') || '',
        ip,
        port,
        cached: false,
        checkedAt: new Date().toISOString(),
      };

      this.cache.set(cacheKey, {
        data: result,
        expiresAt: now + this.cacheTtlMs,
      });

      return result;
    } catch (err: any) {
      this.logger.warn(`Error al consultar estado de servidor ${ip}:${port}: ${err.message}`);

      // Si falló pero tenemos algo en cache viejo, devolverlo con online: false o mantener último valor
      const fallbackResult: ServerStatusResult = {
        online: false,
        players: 0,
        max: 20,
        ip,
        port,
        cached: false,
        checkedAt: new Date().toISOString(),
      };

      return fallbackResult;
    }
  }
}
