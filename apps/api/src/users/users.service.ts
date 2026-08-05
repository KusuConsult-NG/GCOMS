import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

export const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  password: false,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(email: string): Promise<User | null> {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    return this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email ? data.email.trim().toLowerCase() : data.email,
      },
    });
  }
}
