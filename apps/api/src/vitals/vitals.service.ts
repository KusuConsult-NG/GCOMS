import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/pagination';

@Injectable()
export class VitalsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    participantId: string;
    bpSystolic?: number;
    bpDiastolic?: number;
    pulseRate?: number;
    temperature?: number;
    weightKg?: number;
    heightCm?: number;
    oxygenSat?: number;
  }) {
    let bmi: number | undefined;
    if (data.weightKg && data.heightCm && data.heightCm > 0) {
      const heightM = data.heightCm / 100;
      bmi = parseFloat((data.weightKg / (heightM * heightM)).toFixed(1));
    }

    return this.prisma.vitalSign.create({
      data: {
        ...data,
        bmi,
      },
    });
  }

  async findByParticipant(participantId: string) {
    return this.prisma.vitalSign.findMany({
      ...paginate(),
      where: { participantId },
      orderBy: { recordedAt: 'desc' },
    });
  }
}
