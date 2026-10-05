import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AdminCreateUserDto } from './dto-admin';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        skinUrl: true,
        createdAt: true,
        modpacks: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async create(dto: AdminCreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException(`El usuario "${dto.username}" ya existe`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const skinUrl = dto.skinUrl || `https://mc-heads.net/avatar/${encodeURIComponent(dto.username)}/100`;

    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        skinUrl,
        role: dto.role || Role.CREATOR,
      },
      select: {
        id: true,
        username: true,
        role: true,
        skinUrl: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.delete({
      where: { id: user.id },
    });
  }
}
