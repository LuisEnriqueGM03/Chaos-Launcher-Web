import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../../common/utils/ownership';
import { GithubService } from './github.service';
import { GenerateManifestDto } from './dto/generate-manifest.dto';
import { PushManifestDto } from './dto/push-manifest.dto';

@ApiTags('GitHub Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('modpacks')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post('github/generate-manifest')
  @ApiOperation({
    summary: 'Generar manifiesto modpack.json escaneando el repositorio de GitHub',
    description: 'Escanea el árbol Git de GitHub para calcular hashes SHA-1, tamaños y rutas de mods o archivos del modpack.',
  })
  @ApiResponse({ status: 200, description: 'Manifiesto generado exitosamente' })
  generateManifest(@Body() dto: GenerateManifestDto) {
    return this.githubService.generateManifest(dto);
  }

  @Post('github/push-manifest')
  @ApiOperation({
    summary: 'Realizar commit y push de modpack.json directamente a GitHub vía API',
    description: 'Utiliza un Personal Access Token (PAT) de GitHub para crear o actualizar modpack.json en la rama especificada.',
  })
  @ApiResponse({ status: 200, description: 'modpack.json publicado exitosamente en GitHub' })
  pushManifest(@Body() dto: PushManifestDto, @CurrentUser() user: AuthUser) {
    return this.githubService.pushManifest(dto, user);
  }

  @Post(':tag/sync-github')
  @ApiOperation({
    summary: 'Sincronizar modpack automáticamente desde su repositorio de GitHub',
    description: 'Lee el archivo modpack.json en el repositorio de GitHub configurado y actualiza versiones, loader y changelogs.',
  })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Sincronización exitosa con GitHub' })
  syncFromGithub(@Param('tag') tag: string, @CurrentUser() user: AuthUser) {
    return this.githubService.syncModpackFromRepo(tag, user);
  }

  @Get(':tag/github-releases')
  @ApiOperation({ summary: 'Obtener los releases publicados en el repositorio de GitHub del modpack' })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Lista de releases de GitHub' })
  async getReleases(@Param('tag') tag: string) {
    return this.githubService.getReleases(tag);
  }
}
