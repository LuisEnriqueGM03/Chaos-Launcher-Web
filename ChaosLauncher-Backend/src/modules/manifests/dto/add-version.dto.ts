import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString,
  Matches, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class VersionFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  path: string;

  @IsString()
  @Matches(/^[a-fA-F0-9]{40}$/, { message: 'sha1 inválido' })
  sha1: string;

  @IsInt()
  @Min(0)
  size: number;

  @IsString()
  @IsOptional()
  @Matches(/^https:\/\//, { message: 'downloadUrl debe usar https' })
  @MaxLength(2000)
  downloadUrl?: string;
}

export class AddVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version: string;

  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  changelog: string[];

  @IsNumber()
  @IsOptional()
  fileSizeMb?: number;

  @IsString()
  @IsOptional()
  sha1?: string;

  @IsBoolean()
  @IsOptional()
  forceUpdate?: boolean;

  @IsArray()
  @ArrayMaxSize(20000)
  @ValidateNested({ each: true })
  @Type(() => VersionFileDto)
  @IsOptional()
  files?: VersionFileDto[];
}
