import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.referral.findMany({
      include: { participant: true, referredBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id },
      include: { participant: true, referredBy: true },
    });
    if (!referral) throw new NotFoundException('Referral record not found');
    return referral;
  }

  async create(data: { participantId: string; referredTo: string; reason: string; referredById?: string }) {
    return this.prisma.referral.create({
      data: {
        participantId: data.participantId,
        referredTo: data.referredTo,
        reason: data.reason,
        referredById: data.referredById || 'system-user',
        status: 'PENDING',
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.referral.update({
      where: { id },
      data: { status },
    });
  }
}

