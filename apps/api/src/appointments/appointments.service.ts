import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    participantId: string;
    clinicianId: string;
    scheduledAt: string;
    type?: string;
    notes?: string;
  }) {
    return this.prisma.appointment.create({
      data: {
        participantId: data.participantId,
        clinicianId: data.clinicianId,
        scheduledAt: new Date(data.scheduledAt),
        type: data.type || 'FOLLOW_UP',
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        participant: { select: { firstName: true, lastName: true, phoneNumber: true } },
        clinician: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(status?: string, clinicianId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (clinicianId) where.clinicianId = clinicianId;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        participant: { select: { firstName: true, lastName: true, nationalId: true, phoneNumber: true } },
        clinician: { select: { firstName: true, lastName: true, role: true } },
      },
    });
  }

  async updateStatus(id: string, status: string, notes?: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        notes: notes || appt.notes,
      },
    });
  }
}
