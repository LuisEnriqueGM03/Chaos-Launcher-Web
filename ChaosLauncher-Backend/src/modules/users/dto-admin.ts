import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { RegisterDto } from '../auth/dto/register.dto';

/** Solo lo usa POST /users (protegido para SUPERADMIN). */
export class AdminCreateUserDto extends RegisterDto {
  @ApiPropertyOptional({ enum: Role, default: Role.CREATOR })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.CREATOR;
}
