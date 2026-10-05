import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { setAuthCookie, clearAuthCookie } from './auth-cookie';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión (Superadmin o Creador de Minecraft)',
    description: 'Autentica con usuario y contraseña, retornando token JWT para el frontend y studio.',
  })
  @ApiResponse({ status: 200, description: 'Sesión iniciada con éxito' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    setAuthCookie(res, result.accessToken, this.configService.get<string>('auth.jwtExpiresIn'));
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión (elimina la cookie httpOnly)' })
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return { loggedOut: true };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Registrar nueva cuenta de creador de modpacks',
    description: 'Crea una nueva cuenta con avatar/skin de Minecraft seleccionable.',
  })
  @ApiResponse({ status: 201, description: 'Cuenta creada con éxito' })
  @ApiResponse({ status: 409, description: 'El nombre de usuario ya existe' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    setAuthCookie(res, result.accessToken, this.configService.get<string>('auth.jwtExpiresIn'));
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos de la sesión del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil de usuario obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
