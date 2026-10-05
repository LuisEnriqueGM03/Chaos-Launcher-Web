import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar el estado de salud de la API y de la Base de Datos' })
  @ApiResponse({ status: 200, description: 'Servicio en funcionamiento' })
  async check() {
    let databaseStatus = 'unknown';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'disconnected';
    }

    return {
      status: 'ok',
      service: 'ChaosLauncher-API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
      nodeVersion: process.version,
    };
  }
}
