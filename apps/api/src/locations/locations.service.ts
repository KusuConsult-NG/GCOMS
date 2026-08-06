import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.location.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    address?: string;
    lga?: string;
    state?: string;
  }) {
    return this.prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        lga: data.lga,
        state: data.state || 'Plateau State',
      },
    });
  }
}
