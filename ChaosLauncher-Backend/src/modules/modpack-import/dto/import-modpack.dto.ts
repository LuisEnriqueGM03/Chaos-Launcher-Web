import { IsOptional, IsString, Matches, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Campos de texto del formulario multipart (los booleanos y números llegan como string). */
export class ImportModpackDto {
  @ApiProperty({ description: 'Personal Access Token de GitHub con permiso "repo". No se guarda.' })
  @IsString()
  @IsNotEmpty()
  githubToken: string;

  @ApiPropertyOptional({ description: 'Tag de un modpack existente que se quiere actualizar', example: 'mimic-mc' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-_]+$/, { message: 'El tag solo admite minúsculas, números, guiones y guiones bajos' })
  modpackTag?: string;

  @ApiPropertyOptional({ description: 'Nombre del repositorio a crear (por defecto, el tag)', example: 'mimic-mc' })
  @IsString()
  @IsOptional()
  @MaxLength(90)
  repoName?: string;

  @ApiPropertyOptional({ description: '"true" para crear el repositorio privado (el launcher no podrá descargar de él)' })
  @IsString()
  @IsOptional()
  isPrivate?: string;

  @ApiPropertyOptional({ description: 'IP o dominio del servidor (solo al crear un modpack nuevo)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  serverIp?: string;

  @ApiPropertyOptional({ description: 'Puerto del servidor', example: '25565' })
  @IsString()
  @IsOptional()
  serverPort?: string;
}
