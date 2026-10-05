import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ServerStatusService, ServerStatusResult } from './server-status.service';

@ApiTags('Server Status')
@Controller('modpacks')
export class ServerStatusController {
  constructor(private readonly serverStatusService: ServerStatusService) {}

  @Get(':tag/server-status')
  @ApiOperation({
    summary: 'Consultar estado en vivo del servidor de Minecraft (con caché)',
    description: 'Devuelve jugadores en línea, estado del servidor y MOTD con caché configurable.',
  })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Estado obtenido' })
  getStatusByTag(@Param('tag') tag: string): Promise<ServerStatusResult> {
    return this.serverStatusService.getStatusForModpack(tag);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('ping/direct')
  @ApiOperation({ summary: 'Hacer ping a cualquier IP y puerto de Minecraft' })
  @ApiQuery({ name: 'ip', example: 'play.example.com' })
  @ApiQuery({ name: 'port', example: 25565, required: false })
  pingDirect(@Query('ip') ip: string, @Query('port') port?: string): Promise<ServerStatusResult> {
    if (!ip || !/^[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/.test(ip)) {
      throw new BadRequestException('IP o dominio inválido');
    }
    const portNum = port ? parseInt(port, 10) : 25565;
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      throw new BadRequestException('Puerto inválido');
    }
    return this.serverStatusService.pingServer(ip, portNum);
  }
}
