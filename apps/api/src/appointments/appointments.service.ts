import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

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
        participant: {
          select: { firstName: true, lastName: true, phoneNumber: true },
        },
        clinician: { select: { firstName: true, lastName: true } },
      },
    });
  }

  /** `scope` is PhiAccessService.participantScope() — see ReferralsService. */
  async findAll(status?: string, scope?: Prisma.ParticipantWhereInput) {
    const where: Prisma.AppointmentWhereInput = {};
    if (status) where.status = status;
    if (scope) where.participant = scope;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        participant: {
          select: {
            firstName: true,
            lastName: true,
            registrationId: true,
            nationalId: true,
            phoneNumber: true,
          },
        },
        clinician: { select: { firstName: true, lastName: true, role: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    notes: string | undefined,
    actor: PhiActor,
  ) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');

    await this.phi.assertParticipantAccess(
      actor,
      appt.participantId,
      'PATCH /appointments/:id/status',
    );

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        notes: notes || appt.notes,
      },
    });
  }
}
