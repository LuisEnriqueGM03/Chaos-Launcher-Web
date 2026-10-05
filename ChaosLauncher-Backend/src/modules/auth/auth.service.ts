import {
  Injectable,
  OnModuleInit,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureSuperadminExists();
  }

  private async ensureSuperadminExists() {
    const adminUser = this.configService.get<string>('auth.superadminUsername') || 'admin';
    const adminPass = this.configService.get<string>('auth.superadminPassword');

    try {
      const existingAdmin = await this.prisma.user.findUnique({
        where: { username: adminUser },
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPass, 10);
        await this.prisma.user.create({
          data: {
            username: adminUser,
            password: hashedPassword,
            role: Role.SUPERADMIN,
            skinUrl: 'https://mc-heads.net/avatar/MHF_Steve/100',
          },
        });
        this.logger.log(`👑 Superadmin "${adminUser}" inicializado automáticamente desde .env`);
      } else {
        // Actualizar contraseña si cambió en el .env
        const matches = await bcrypt.compare(adminPass, existingAdmin.password);
        if (!matches || existingAdmin.role !== Role.SUPERADMIN) {
          const hashedPassword = await bcrypt.hash(adminPass, 10);
          await this.prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
              password: hashedPassword,
              role: Role.SUPERADMIN,
            },
          });
          this.logger.log(`👑 Superadmin "${adminUser}" sincronizado con las credenciales de .env`);
        }
      }
    } catch (err: any) {
      this.logger.error(`No se pudo verificar el superadmin en el inicio: ${err.message}`);
    }
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        skinUrl: user.skinUrl,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, skinUrl } = registerDto;

    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new ConflictException(`El nombre de usuario "${username}" ya está registrado`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedSkin =
      skinUrl || `https://mc-heads.net/avatar/${encodeURIComponent(username)}/100`;

    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        skinUrl: resolvedSkin,
        role: Role.CREATOR,
      },
      select: {
        id: true,
        username: true,
        role: true,
        skinUrl: true,
        createdAt: true,
      },
    });

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        skinUrl: true,
        createdAt: true,
        _count: {
          select: { modpacks: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}
