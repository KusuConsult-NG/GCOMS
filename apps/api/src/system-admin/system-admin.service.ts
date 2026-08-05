import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemAdminService {
  constructor(private prisma: PrismaService) {}

  async setConfig(key: string, value: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  async getConfigs() {
    return this.prisma.systemConfig.findMany();
  }
}
