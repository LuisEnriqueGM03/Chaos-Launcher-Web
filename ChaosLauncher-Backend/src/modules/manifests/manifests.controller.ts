import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../../common/utils/ownership';
import { AddVersionDto } from './dto/add-version.dto';
import { ManifestsService } from './manifests.service';
import { RawResponse } from '../../common/decorators/raw-response.decorator';

@ApiTags('Manifests')
@Controller('modpacks/:tag')
export class ManifestsController {
  constructor(private readonly manifestsService: ManifestsService) {}

  @Get('manifest')
  @RawResponse()
  @ApiOperation({
    summary: 'Obtener el manifiesto JSON del modpack para el Launcher (Differential Sync)',
    description: 'Endpoint 100% compatible con la interfaz ModpackManifest de ChaosLauncher-esc',
  })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 200, description: 'Manifiesto completo generado' })
  @ApiResponse({ status: 404, description: 'Modpack no encontrado' })
  getManifest(@Param('tag') tag: string) {
    return this.manifestsService.getManifest(tag);
  }

  @Post('versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar una nueva versión del modpack con su lista de archivos diferencial' })
  @ApiParam({ name: 'tag', example: 'mimic-mc' })
  @ApiResponse({ status: 201, description: 'Nueva versión creada exitosamente' })
  addVersion(
    @Param('tag') tag: string,
    @Body() body: AddVersionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.manifestsService.addVersion(tag, body, user);
  }
}
