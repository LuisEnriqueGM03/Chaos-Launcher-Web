import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ManifestScope {
  MODS = 'mods',
  ALL = 'all',
}

export class GenerateManifestDto {
  @ApiProperty({
    description: 'Repositorio de GitHub (ej. owner/repo o URL completa)',
    example: 'owner/repo',
  })
  @IsString()
  @IsNotEmpty()
  repo: string;

  @ApiPropertyOptional({
    description: 'Rama de Git a escanear',
    example: 'main',
    default: 'main',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    description: 'Alcance del escaneo: solo carpeta mods o todo el juego',
    enum: ManifestScope,
    default: ManifestScope.MODS,
  })
  @IsEnum(ManifestScope)
  @IsOptional()
  scope?: ManifestScope;

  @ApiPropertyOptional({
    description: 'Token de acceso personal de GitHub (opcional, para repos privados o evitar límites de tasa)',
  })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiPropertyOptional({ description: 'Nombre del Modpack' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Versión del Modpack', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Versión de Minecraft', example: '1.21.1' })
  @IsString()
  @IsOptional()
  minecraftVersion?: string;

  @ApiPropertyOptional({ description: 'Tipo de modloader', example: 'neoforge' })
  @IsString()
  @IsOptional()
  loaderType?: string;

  @ApiPropertyOptional({ description: 'Versión del modloader', example: '21.1.248' })
  @IsString()
  @IsOptional()
  loaderVersion?: string;

  @ApiPropertyOptional({ description: 'IP del servidor' })
  @IsString()
  @IsOptional()
  serverIp?: string;

  @ApiPropertyOptional({ description: 'Puerto del servidor', example: 25565 })
  @IsNumber()
  @IsOptional()
  serverPort?: number;

  @ApiPropertyOptional({ description: 'Memoria RAM recomendada en MB', example: 6144 })
  @IsNumber()
  @IsOptional()
  recommendedRam?: number;

  @ApiPropertyOptional({ description: 'Forzar actualización en el launcher' })
  @IsBoolean()
  @IsOptional()
  forceUpdate?: boolean;

  @ApiPropertyOptional({ description: 'Notas del changelog', type: [String] })
  @IsArray()
  @IsOptional()
  changelog?: string[];
}
