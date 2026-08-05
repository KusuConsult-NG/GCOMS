import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.community.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; lga: string; state?: string; population?: number; leaderName?: string }) {
    return this.prisma.community.create({
      data: {
        name: data.name,
        lga: data.lga,
        state: data.state || 'Plateau',
        population: data.population || 0,
        leaderName: data.leaderName,
      },
    });
  }
}

