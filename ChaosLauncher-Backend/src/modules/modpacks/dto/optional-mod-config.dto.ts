import { IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ModConfigItemDto {
  @ApiProperty({ example: 'iris_shaders', description: 'Identificador único del mod' })
  @IsString()
  modId: string;

  @ApiProperty({ example: 'Iris Shaders', description: 'Nombre amigable del mod' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'iris-neoforge-1.8.14-beta.1+mc1.21.1.jar', description: 'Nombre exacto del archivo JAR' })
  @IsString()
  file: string;

  @ApiProperty({ example: 'Soporte para Shaders de alto rendimiento gráfico.', description: 'Descripción detallada para los jugadores' })
  @IsString()
  description: string;

  @ApiProperty({ example: true, description: 'Si el mod debe estar habilitado por defecto al instalarse' })
  @IsBoolean()
  defaultEnabled: boolean;
}

export class SaveOptionalModsDto {
  @ApiProperty({ type: [ModConfigItemDto], description: 'Lista de mods configurados como opcionales' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModConfigItemDto)
  mods: ModConfigItemDto[];
}
