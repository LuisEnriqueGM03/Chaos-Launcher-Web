import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { LoaderType } from '@prisma/client';

export class CreateOptionalModDto {
  @ApiProperty({ example: 'iris_shaders' })
  @IsString()
  @IsNotEmpty()
  modId: string;

  @ApiProperty({ example: 'Iris Shaders' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'iris-neoforge-1.8.14-beta.1+mc1.21.1.jar' })
  @IsString()
  @IsNotEmpty()
  file: string;

  @ApiPropertyOptional({ example: 'Soporte para Shaders de alto rendimiento gráfico.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  defaultEnabled?: boolean = true;
}

export class CreateModpackDto {
  @ApiProperty({ example: 'Mimic MC', description: 'Nombre oficial del modpack' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'mimic-mc',
    description:
      'Tag o slug único del modpack. Es el identificador que usa el launcher como nombre de carpeta, por eso no se puede cambiar después.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64, { message: 'El tag admite como máximo 64 caracteres' })
  @Matches(/^[a-z0-9-_]+$/, {
    message: 'El tag debe contener solo letras minúsculas, números, guiones o guiones bajos',
  })
  tag: string;

  @ApiPropertyOptional({ example: 'Servidor oficial de exploración RPG con más de 280 mods' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '#f59e0b', description: 'Color representativo en formato Hex' })
  @IsString()
  @IsOptional()
  accentColor?: string = '#ff4500';

  @ApiPropertyOptional({ example: 'https://raw.githubusercontent.com/.../icon.png', description: 'URL o ruta del icono' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ example: 'https://raw.githubusercontent.com/.../wallpaper.jpg', description: 'URL o ruta del wallpaper/banner' })
  @IsString()
  @IsOptional()
  wallpaperUrl?: string;

  @ApiPropertyOptional({ example: 'https://raw.githubusercontent.com/.../title.png', description: 'URL del logo/banner de título panorámico (1900 x 550 px)' })
  @IsString()
  @IsOptional()
  titleImageUrl?: string;

  @ApiPropertyOptional({ example: 'BOTH', description: 'Modo de visualización del título: IMAGE_ONLY, TEXT_ONLY, BOTH o ICON_ONLY' })
  @IsString()
  @IsOptional()
  titleDisplayMode?: string;

  @ApiPropertyOptional({ example: 'MIMIC MC', description: 'Texto personalizado para el título en el launcher' })
  @IsString()
  @IsOptional()
  titleText?: string;

  @ApiProperty({ example: 'play.example.com', description: 'Dirección IP o dominio del servidor de Minecraft' })
  @IsString()
  @IsNotEmpty()
  serverIp: string;

  @ApiPropertyOptional({ example: 25565, default: 25565, description: 'Puerto del servidor de Minecraft' })
  @IsInt()
  @IsOptional()
  @Min(1)
  serverPort?: number = 25565;

  @ApiPropertyOptional({ example: '1.0.0', default: '1.0.0', description: 'Versión actual del modpack' })
  @IsString()
  @IsOptional()
  version?: string = '1.0.0';

  @ApiProperty({ example: '1.21.1', description: 'Versión base de Minecraft' })
  @IsString()
  @IsNotEmpty()
  minecraftVersion: string;

  @ApiPropertyOptional({ enum: LoaderType, default: LoaderType.NEOFORGE, description: 'Tipo de Modloader' })
  @IsEnum(LoaderType)
  @IsOptional()
  loaderType?: LoaderType = LoaderType.NEOFORGE;

  @ApiPropertyOptional({ example: '21.1.248', description: 'Versión del Modloader' })
  @IsString()
  @IsOptional()
  loaderVersion?: string;

  @ApiPropertyOptional({ example: 6144, default: 6144, description: 'RAM recomendada en Megabytes (MB)' })
  @IsInt()
  @IsOptional()
  @Min(1024)
  recommendedRam?: number = 6144;

  @ApiPropertyOptional({ example: 4096, default: 4096, description: 'RAM mínima en Megabytes (MB)' })
  @IsInt()
  @IsOptional()
  @Min(1024)
  minRam?: number = 4096;

  @ApiPropertyOptional({ example: 'owner/repo', description: 'Repositorio de GitHub conectado' })
  @IsString()
  @IsOptional()
  githubRepo?: string;

  @ApiPropertyOptional({ example: 'main', default: 'main', description: 'Rama de GitHub' })
  @IsString()
  @IsOptional()
  githubBranch?: string = 'main';

  @ApiPropertyOptional({ example: 'https://raw.githubusercontent.com/.../modpack.json', description: 'URL de descarga directa o manifiesto tradicional' })
  @IsString()
  @IsOptional()
  downloadUrl?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Obligatoriedad de actualizar para jugar' })
  @IsBoolean()
  @IsOptional()
  forceUpdate?: boolean = true;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Orden de aparición en el Sidebar' })
  @IsInt()
  @IsOptional()
  order?: number = 0;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({ example: true, default: true, description: 'Habilita el módulo de Mods Incluidos y la pestaña Mods' })
  @IsBoolean()
  @IsOptional()
  hasOptionalMods?: boolean;

  @ApiPropertyOptional({ example: false, default: false, description: 'Habilita el módulo de Normativa y la pestaña Normas' })
  @IsBoolean()
  @IsOptional()
  hasRules?: boolean;

  @ApiPropertyOptional({ example: '# Normas del Servidor\n1. Respeto mutuo\n2. No usar hacks', description: 'Contenido del reglamento en formato Markdown' })
  @IsString()
  @IsOptional()
  rulesContent?: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'Habilita el módulo de Discord y la pestaña Discord' })
  @IsBoolean()
  @IsOptional()
  hasDiscord?: boolean;

  @ApiPropertyOptional({ example: 'https://discord.gg/ejemplo', description: 'Enlace de invitación de Discord' })
  @IsString()
  @IsOptional()
  discordUrl?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Habilita el módulo de Changelog y la pestaña Changelog' })
  @IsBoolean()
  @IsOptional()
  hasChangelog?: boolean;

  @ApiPropertyOptional({ example: ['✨ Actualización v1.0.0', '⚡ Rendimiento mejorado'], type: [String] })
  @IsArray()
  @IsOptional()
  changelog?: string[] = [];

  @ApiPropertyOptional({ type: [CreateOptionalModDto], description: 'Lista de mods opcionales (shaders, optimizaciones)' })
  @IsArray()
  @IsOptional()
  optionalMods?: CreateOptionalModDto[] = [];
}
