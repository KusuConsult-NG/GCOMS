import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';

/**
 * Reads take `scope` — PhiAccessService.participantScope() for the caller.
 * undefined means oversight (no restriction); otherwise the query is limited to
 * the caller's caseload. This replaces the previous `clinicianId` narrowing,
 * which only ever applied to CLINICIAN and left every other role unfiltered.
 */

@Injectable()
export class FollowUpService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  async getAll(status?: string, scope?: Prisma.ParticipantWhereInput) {
    const where: Prisma.FollowUpWhereInput = {};
    if (status) where.status = status;
    if (scope) where.participant = scope;

    return this.prisma.followUp.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            phoneNumber: true,
            gender: true,
          },
        },
        clinician: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getOne(id: string, scope?: Prisma.ParticipantWhereInput) {
    const followUp = await this.prisma.followUp.findFirst({
      where: { id, ...(scope ? { participant: scope } : {}) },
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

  async updateStatus(
    id: string,
    status: string,
    notes: string | undefined,
    actor: PhiActor,
  ) {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    // Keyed by follow-up id, so the owning participant has to be resolved here
    // rather than by ParticipantAccessGuard.
    await this.phi.assertParticipantAccess(
      actor,
      followUp.participantId,
      'PATCH /follow-ups/:id/status',
    );

    return this.prisma.followUp.update({
      where: { id },
      data: {
        status,
        notes: notes || followUp.notes,
        updatedAt: new Date(),
      },
    });
  }

  async getUpcoming(days = 7, scope?: Prisma.ParticipantWhereInput) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.prisma.followUp.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { gte: now, lte: future },
        ...(scope ? { participant: scope } : {}),
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        participant: {
          select: { firstName: true, lastName: true, phoneNumber: true },
        },
        clinician: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getMissed(scope?: Prisma.ParticipantWhereInput) {
    const now = new Date();
    return this.prisma.followUp.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { lt: now },
        ...(scope ? { participant: scope } : {}),
      },
      orderBy: { scheduledDate: 'desc' },
      include: {
        participant: {
          select: {
            firstName: true,
            lastName: true,
            nationalId: true,
            phoneNumber: true,
          },
        },
        clinician: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getDashboardStats(scope?: Prisma.ParticipantWhereInput) {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const inScope = scope ? { participant: scope } : {};

    const [scheduled, completed, missed, cancelled, upcoming] =
      await Promise.all([
        this.prisma.followUp.count({
          where: { status: 'SCHEDULED', ...inScope },
        }),
        this.prisma.followUp.count({
          where: { status: 'COMPLETED', ...inScope },
        }),
        this.prisma.followUp.count({
          where: {
            status: 'SCHEDULED',
            scheduledDate: { lt: now },
            ...inScope,
          },
        }),
        this.prisma.followUp.count({
          where: { status: 'CANCELLED', ...inScope },
        }),
        this.prisma.followUp.count({
          where: {
            status: 'SCHEDULED',
            scheduledDate: { gte: now, lte: nextWeek },
            ...inScope,
          },
        }),
      ]);

    return { scheduled, completed, missed, cancelled, upcoming };
  }
}
