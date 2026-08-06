import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';

/**
 * `scope` is PhiAccessService.participantScope() for the caller — undefined for
 * oversight roles, a caseload predicate for front-line ones. Referrals are a
 * worklist, so they are hard-scoped; the audited break-glass route for a patient
 * outside the caseload is GET /participants/:id.
 */
@Injectable()
export class ReferralsService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  async getAll(scope?: Prisma.ParticipantWhereInput) {
    return this.prisma.referral.findMany({
      where: scope ? { participant: scope } : {},
      include: { participant: true, referredBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string, scope?: Prisma.ParticipantWhereInput) {
    const referral = await this.prisma.referral.findFirst({
      where: { id, ...(scope ? { participant: scope } : {}) },
      include: { participant: true, referredBy: true },
    });
    if (!referral) throw new NotFoundException('Referral record not found');
    return referral;
  }

  async create(data: {
    participantId: string;
    referredTo: string;
    reason: string;
    referredById?: string;
  }) {
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

  async updateStatus(id: string, status: string, actor: PhiActor) {
    const referral = await this.prisma.referral.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Referral record not found');

    await this.phi.assertParticipantAccess(
      actor,
      referral.participantId,
      'PUT /referrals/:id/status',
    );

    return this.prisma.referral.update({
      where: { id },
      data: { status },
    });
  }
}
