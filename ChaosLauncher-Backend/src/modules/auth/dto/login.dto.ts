import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario de Minecraft / Creador / Superadmin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'tu_contraseña', description: 'Contraseña de la cuenta' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}
