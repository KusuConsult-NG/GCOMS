import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowUpService {
  constructor(private prisma: PrismaService) {}

  async getAll(status?: string, clinicianId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (clinicianId) where.clinicianId = clinicianId;

    return this.prisma.followUp.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        participant: {
          select: { id: true, firstName: true, lastName: true, nationalId: true, phoneNumber: true, gender: true },
        },
        clinician: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getOne(id: string) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id },
      include: {
        participant: true,
        clinician: { select: { firstName: true, lastName: true, role: true } },
      },
    });
    if (!followUp) throw new NotFoundException('Follow-up not found');
    return followUp;
  }

  async create(data: {
    participantId: string;
    clinicianId: string;
    scheduledDate: string;
    notes?: string;
  }) {
    return this.prisma.followUp.create({
      data: {
        participantId: data.participantId,
        clinicianId: data.clinicianId,
        scheduledDate: new Date(data.scheduledDate),
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        participant: { select: { firstName: true, lastName: true } },
        clinician: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, status: string, notes?: string) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    return this.prisma.followUp.update({
      where: { id },
      data: {
        status,
        notes: notes || followUp.notes,
        updatedAt: new Date(),
      },
    });
  }

  async getUpcoming(days = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.prisma.followUp.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { gte: now, lte: future },
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        participant: { select: { firstName: true, lastName: true, phoneNumber: true } },
        clinician: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getMissed() {
    const now = new Date();
    return this.prisma.followUp.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { lt: now },
      },
      orderBy: { scheduledDate: 'desc' },
      include: {
        participant: { select: { firstName: true, lastName: true, nationalId: true, phoneNumber: true } },
        clinician: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getDashboardStats() {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [scheduled, completed, missed, cancelled, upcoming] = await Promise.all([
      this.prisma.followUp.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.followUp.count({ where: { status: 'COMPLETED' } }),
      this.prisma.followUp.count({ where: { status: 'SCHEDULED', scheduledDate: { lt: now } } }),
      this.prisma.followUp.count({ where: { status: 'CANCELLED' } }),
      this.prisma.followUp.count({ where: { status: 'SCHEDULED', scheduledDate: { gte: now, lte: nextWeek } } }),
    ]);

    return { scheduled, completed, missed, cancelled, upcoming };
  }
}
