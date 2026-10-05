import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as os from 'os';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../../common/utils/ownership';
import { ImportModpackDto } from './dto/import-modpack.dto';
import { ModpackImportService } from './modpack-import.service';

const MAX_ZIP_BYTES = 1024 * 1024 * 1024;

@ApiTags('Modpack Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('modpacks/import')
export class ModpackImportController {
  constructor(private readonly importService: ModpackImportService) {}

  @Post()
  @ApiOperation({
    summary: 'Importar un ZIP de modpack (CurseForge) y crear o actualizar su repositorio de GitHub',
    description:
      'Sube el ZIP, crea el repositorio si el modpack no tiene uno (o actualiza el existente con una versión nueva) y publica modpack.json. ' +
      'Devuelve un jobId; consulta el progreso con GET /modpacks/import/:jobId.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (_req, _file, cb) => cb(null, `chaos-import-${randomUUID()}.zip`),
      }),
      limits: { fileSize: MAX_ZIP_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
          return cb(new BadRequestException('El archivo debe ser un .zip'), false);
        }
        cb(null, true);
      },
    }),
  )
  start(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportModpackDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo ZIP (campo "file").');
    const port = dto.serverPort ? parseInt(dto.serverPort, 10) : undefined;
    if (dto.serverPort && (!Number.isInteger(port) || port! < 1 || port! > 65535)) {
      throw new BadRequestException('Puerto de servidor inválido.');
    }
    try {
      const job = this.importService.start({
        zipPath: file.path,
        githubToken: dto.githubToken,
        user,
        modpackTag: dto.modpackTag || undefined,
        repoName: dto.repoName || undefined,
        isPrivate: dto.isPrivate === 'true',
        serverIp: dto.serverIp || undefined,
        serverPort: port,
      });
      return { jobId: job.id };
    } catch (err) {
      // Si no arrancó el trabajo, el ZIP temporal no lo limpiará nadie
      import('fs').then((fs) => fs.promises.unlink(file.path).catch(() => undefined));
      throw err;
    }
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Estado de una importación (etapa, porcentaje, registro y resultado)' })
  status(@Param('jobId') jobId: string, @CurrentUser() user: AuthUser) {
    const { id, status, stage, percent, log, result, error } = this.importService.getJob(jobId, user);
    return { id, status, stage, percent, log, result, error };
  }
}
