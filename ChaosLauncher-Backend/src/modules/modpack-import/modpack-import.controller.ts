import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  PayloadTooLargeException,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../../common/utils/ownership';
import { ImportModpackDto } from './dto/import-modpack.dto';
import { InitUploadDto } from './dto/init-upload.dto';
import { ChunkedUploadService, MAX_CHUNK_BYTES, MAX_ZIP_BYTES } from './chunked-upload.service';
import { ModpackImportService } from './modpack-import.service';

/** Lee el cuerpo de la petición (una parte del ZIP) con un límite de tamaño. */
function readBody(req: Request, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let tooBig = false;
    req.on('data', (c: Buffer) => {
      total += c.length;
      if (total > limit) {
        tooBig = true;
        return; // se sigue leyendo (sin guardar) para poder responder 413 limpiamente
      }
      chunks.push(c);
    });
    req.on('end', () =>
      tooBig
        ? reject(new PayloadTooLargeException(`Cada parte puede pesar como máximo ${limit / 1048576} MB.`))
        : resolve(Buffer.concat(chunks)),
    );
    req.on('error', reject);
  });
}

@ApiTags('Modpack Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('modpacks/import')
export class ModpackImportController {
  constructor(
    private readonly importService: ModpackImportService,
    private readonly uploads: ChunkedUploadService,
  ) {}

  private parseParams(dto: ImportModpackDto, zipPath: string, user: AuthUser) {
    const port = dto.serverPort ? parseInt(dto.serverPort, 10) : undefined;
    if (dto.serverPort && (!Number.isInteger(port) || port! < 1 || port! > 65535)) {
      throw new BadRequestException('Puerto de servidor inválido.');
    }
    return {
      zipPath,
      githubToken: dto.githubToken,
      user,
      modpackTag: dto.modpackTag || undefined,
      repoName: dto.repoName || undefined,
      isPrivate: dto.isPrivate === 'true',
      serverIp: dto.serverIp || undefined,
      serverPort: port,
    };
  }

  // ---------------------------------------------------------------------
  // Subida por partes (recomendada: funciona detrás de Cloudflare, que limita cada petición a 100 MB)
  // ---------------------------------------------------------------------

  @Post('upload')
  @ApiOperation({ summary: 'Paso 1 de la subida por partes: anunciar el ZIP (nombre y tamaño)' })
  initUpload(@Body() dto: InitUploadDto, @CurrentUser() user: AuthUser) {
    return this.uploads.init(user, dto.fileName, dto.size);
  }

  @Put('upload/:uploadId/chunk')
  @ApiOperation({ summary: 'Paso 2: enviar una parte del ZIP (cuerpo binario, en orden, índice desde 0)' })
  async uploadChunk(
    @Param('uploadId') uploadId: string,
    @Query('index') index: string,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await readBody(req, MAX_CHUNK_BYTES);
    return this.uploads.appendChunk(uploadId, user, parseInt(index, 10), data);
  }

  @Post('upload/:uploadId/start')
  @ApiOperation({ summary: 'Paso 3: con todas las partes enviadas, iniciar la importación. Devuelve jobId' })
  startUploaded(
    @Param('uploadId') uploadId: string,
    @Body() dto: ImportModpackDto,
    @CurrentUser() user: AuthUser,
  ) {
    const zipPath = this.uploads.complete(uploadId, user);
    try {
      const job = this.importService.start(this.parseParams(dto, zipPath, user));
      return { jobId: job.id };
    } catch (err) {
      fs.promises.unlink(zipPath).catch(() => undefined);
      throw err;
    }
  }

  // ---------------------------------------------------------------------
  // Subida directa en una sola petición (para ZIP pequeños o acceso local)
  // ---------------------------------------------------------------------

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
    try {
      const job = this.importService.start(this.parseParams(dto, file.path, user));
      return { jobId: job.id };
    } catch (err) {
      // Si no arrancó el trabajo, el ZIP temporal no lo limpiará nadie
      fs.promises.unlink(file.path).catch(() => undefined);
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
