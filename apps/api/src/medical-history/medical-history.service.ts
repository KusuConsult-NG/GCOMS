import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicalHistoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    participantId: string;
    conditionName: string;
    diagnosisDate?: string;
    familyHistory?: string;
    lifestyleNotes?: string;
    allergies?: string;
  }) {
    return this.prisma.medicalHistory.create({
      data: {
        participantId: data.participantId,
        conditionName: data.conditionName,
        diagnosisDate: data.diagnosisDate ? new Date(data.diagnosisDate) : null,
        familyHistory: data.familyHistory,
        lifestyleNotes: data.lifestyleNotes,
        allergies: data.allergies,
      },
    });
  }

  async findByParticipant(participantId: string) {
    return this.prisma.medicalHistory.findMany({
      where: { participantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
