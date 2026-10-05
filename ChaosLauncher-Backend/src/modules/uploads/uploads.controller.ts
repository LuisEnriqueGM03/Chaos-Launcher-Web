import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @ApiOperation({ summary: 'Subir icono o wallpaper del modpack al servidor' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'category',
    enum: ['icons', 'wallpapers', 'general'],
    required: false,
    description: 'Categoría de la imagen para su organización',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido correctamente con su URL generada' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category?: string,
  ) {
    if (category && !['icons', 'wallpapers', 'general'].includes(category)) {
      throw new BadRequestException('Categoría inválida');
    }
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.uploadsService.saveFile(file, (category as 'icons' | 'wallpapers' | 'general') || 'general');
  }
}
