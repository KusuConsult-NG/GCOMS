import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/pagination';

@Injectable()
export class ScreeningsService {
  constructor(private prisma: PrismaService) {}

  async calculateRiskScore(data: {
    cancerType: string;
    result: string;
    participantId: string;
  }) {
    let baseScore = 2.0;

    // 1. Result weighting
    if (data.result.toUpperCase().includes('POSITIVE')) {
      baseScore += 6.0;
    } else if (data.result.toUpperCase().includes('SUSPICIOUS')) {
      baseScore += 4.0;
    } else {
      baseScore += 0.5;
    }

    // 2. Cancer type weighting
    if (data.cancerType.toLowerCase().includes('cervical')) {
      baseScore += 1.0;
    } else if (data.cancerType.toLowerCase().includes('breast')) {
      baseScore += 0.8;
    }

    // 3. Participant age weighting if available
    const participant = await this.prisma.participant.findUnique({
      where: { id: data.participantId },
    });

    if (participant && participant.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - new Date(participant.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age > 50) baseScore += 1.0;
      else if (age > 40) baseScore += 0.5;
    }

    return Math.min(10.0, parseFloat(baseScore.toFixed(1)));
  }

  async createScreening(data: any, userId: string) {
    const riskScore = data.riskScore
      ? parseFloat(data.riskScore)
      : await this.calculateRiskScore(data);

    return this.prisma.screening.create({
      data: {
        cancerType: data.cancerType,
        result: data.result,
        riskScore,
        participantId: data.participantId,
        conductedById: userId,
      },
      include: {
        participant: {
          select: { firstName: true, lastName: true, nationalId: true },
        },
      },
    });
  }

  async getScreenings(participantId: string) {
    return this.prisma.screening.findMany({
      ...paginate(),
      where: { participantId },
      orderBy: { createdAt: 'desc' },
      include: {
        conductedBy: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });
  }
}
