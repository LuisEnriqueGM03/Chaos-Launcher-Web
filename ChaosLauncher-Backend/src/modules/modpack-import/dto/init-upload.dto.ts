import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitUploadDto {
  @ApiProperty({ example: 'Mimic MC.zip' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ description: 'Tamaño total del ZIP en bytes', example: 225482380 })
  @IsInt()
  @Min(1)
  @Max(1024 * 1024 * 1024)
  size: number;
}
