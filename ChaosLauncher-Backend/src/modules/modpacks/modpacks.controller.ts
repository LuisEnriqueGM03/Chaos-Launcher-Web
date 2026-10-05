import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { AuthUser } from '../../common/utils/ownership';
import { ModpacksService } from './modpacks.service';
import { CreateModpackDto } from './dto/create-modpack.dto';
import { UpdateModpackDto } from './dto/update-modpack.dto';
import { SaveOptionalModsDto } from './dto/optional-mod-config.dto';

@ApiTags('Modpacks')
@Controller('modpacks')
export class ModpacksController {
  constructor(private readonly modpacksService: ModpacksService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener catálogo de modpacks (para el Sidebar del Launcher)' })
  @ApiQuery({ name: 'all', required: false, type: Boolean, description: 'Incluir modpacks inactivos' })
  @ApiResponse({ status: 200, description: 'Lista de modpacks obtenida exitosamente' })
  findAll(@Query('all') all?: string) {
    const includeInactive = all === 'true' || all === '1';
    return this.modpacksService.findAll(includeInactive);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar lista de modpacks y sincronizar con repositorios remotos' })
  @ApiResponse({ status: 200, description: 'Lista de modpacks actualizada exitosamente' })
  refresh() {
    return this.modpacksService.refreshAll();
  }

  @Get(':tag')
  @ApiOperation({ summary: 'Obtener información detallada de un modpack por su tag' })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Detalle del modpack' })
  @ApiResponse({ status: 404, description: 'Modpack no encontrado' })
  findOne(@Param('tag') tag: string) {
    return this.modpacksService.findOneByTag(tag);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo modpack en la base de datos' })
  @ApiResponse({ status: 201, description: 'Modpack creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El tag ya está en uso' })
  create(
    @Body() createModpackDto: CreateModpackDto,
    @CurrentUser('id') authorId: string,
  ) {
    return this.modpacksService.create(createModpackDto, authorId);
  }

  @Patch(':tag')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar configuración, colores, versiones o datos de un modpack' })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Modpack actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Modpack no encontrado' })
  update(
    @Param('tag') tag: string,
    @Body() updateModpackDto: UpdateModpackDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modpacksService.update(tag, updateModpackDto, user);
  }

  @Get(':tag/source-mods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Inspeccionar modpack.json y listar todos los mods del paquete para configuración',
  })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Lista de mods extraída del modpack.json' })
  getSourceMods(@Param('tag') tag: string, @CurrentUser() user: AuthUser) {
    return this.modpacksService.inspectSourceMods(tag, user);
  }

  @Put(':tag/optional-mods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Guardar configuración de mods opcionales (switches y descripciones)',
  })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Mods opcionales guardados exitosamente' })
  updateOptionalMods(
    @Param('tag') tag: string,
    @Body() dto: SaveOptionalModsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modpacksService.updateOptionalMods(tag, dto.mods, user);
  }

  @Delete(':tag')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un modpack de la base de datos' })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Modpack eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Modpack no encontrado' })
  remove(@Param('tag') tag: string, @CurrentUser() user: AuthUser) {
    return this.modpacksService.remove(tag, user);
  }
}
