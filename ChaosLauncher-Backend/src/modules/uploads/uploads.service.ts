import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;
  private readonly staticPath: string;

  constructor(private readonly configService: ConfigService) {
    const rawDir = this.configService.get<string>('storage.uploadDir') || './uploads';
    this.uploadDir = path.isAbsolute(rawDir) ? rawDir : path.resolve(process.cwd(), rawDir);
    this.staticPath = this.configService.get<string>('storage.staticServePath') || '/static';

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private matchesMagicBytes(buf: Buffer, ext: string): boolean {
    if (!buf || buf.length < 12) return false;
    switch (ext) {
      case '.png':
        return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case '.jpg':
      case '.jpeg':
        return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      case '.gif':
        return buf.subarray(0, 4).toString('ascii') === 'GIF8';
      case '.webp':
        return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
      default:
        return false;
    }
  }

  async saveFile(file: Express.Multer.File, category: 'icons' | 'wallpapers' | 'general' = 'general') {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo para subir.');
    }

    const targetSubdir = path.join(this.uploadDir, category);
    if (!fs.existsSync(targetSubdir)) {
      fs.mkdirSync(targetSubdir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(`Formato de archivo no soportado (${ext}). Formatos válidos: ${allowedExtensions.join(', ')}`);
    }

    if (!this.matchesMagicBytes(file.buffer, ext)) {
      throw new BadRequestException('El contenido del archivo no coincide con su extensión.');
    }

    const uniqueName = `${category}_${Date.now()}_${randomBytes(6).toString('hex')}${ext}`;
    const targetFilePath = path.join(targetSubdir, uniqueName);

    await fs.promises.writeFile(targetFilePath, file.buffer);
    this.logger.log(`Archivo guardado: ${targetFilePath}`);

    const baseUrl = this.configService.get<string>('appUrl') || 'http://localhost:3000';
    const relativeUrl = `${this.staticPath}/${category}/${uniqueName}`;
    const fullUrl = `${baseUrl.replace(/\/$/, '')}${relativeUrl}`;

    return {
      fileName: uniqueName,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: fullUrl,
      relativeUrl,
    };
  }
}
