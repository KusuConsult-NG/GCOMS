import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrantsService {
  constructor(private prisma: PrismaService) {}

  async createGrant(data: any, userId: string) {
    return this.prisma.grant.create({
      data: {
        donorName: data.donorName,
        grantName: data.grantName,
        amount: parseFloat(data.amount),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managedById: userId,
      }
    });
  }

  async getGrants() {
    return this.prisma.grant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        managedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });
  }
}
