import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PushManifestDto {
  @ApiProperty({
    description: 'Repositorio de GitHub (ej. owner/repo)',
    example: 'owner/repo',
  })
  @IsString()
  @IsNotEmpty()
  repo: string;

  @ApiPropertyOptional({
    description: 'Rama destino en GitHub',
    example: 'main',
    default: 'main',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiProperty({
    description: 'Personal Access Token (PAT) de GitHub con permiso de repo o contents:write',
  })
  @IsString()
  @IsNotEmpty()
  githubToken: string;

  @ApiProperty({
    description: 'Objeto completo del manifiesto modpack.json',
  })
  @IsObject()
  @IsNotEmpty()
  manifest: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Mensaje del commit',
    example: 'chore: actualizar modpack.json con nuevas versiones de mods',
  })
  @IsString()
  @IsOptional()
  commitMessage?: string;

  @ApiPropertyOptional({
    description: 'Tag del modpack en ChaosLauncher para sincronizarlo inmediatamente tras el commit',
  })
  @IsString()
  @IsOptional()
  modpackTag?: string;
}
