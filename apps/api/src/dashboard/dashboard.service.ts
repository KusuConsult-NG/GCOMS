import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
import { PHI_READ_ROLES, Role } from '../auth/roles.constants';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  /**
   * Operational counts for every role, but the patient-derived figures are
   * scoped to the caller's caseload, and the recent-patient list is withheld
   * entirely from roles with no clinical need for identified records.
   */
  async getStats(actor: PhiActor) {
    const scope = this.phi.participantScope(actor);
    const participantWhere = scope ?? {};
    const byParticipant = scope ? { participant: scope } : {};
    const mayReadPhi = PHI_READ_ROLES.includes(actor.role as Role);

    const [
      totalParticipants,
      totalScreenings,
      positiveScreenings,
      pendingApprovals,
      activeReferrals,
      totalCommunities,
      totalOutreaches,
      activeProjects,
      recentParticipants,
    ] = await Promise.all([
      this.prisma.participant.count({ where: participantWhere }),
      this.prisma.screening.count({ where: byParticipant }),
      // Counted in the database. This previously loaded every screening row
      // just to tally positives in JavaScript, which grows without bound and is
      // why it could not simply be capped like the list endpoints.
      this.prisma.screening.count({
        where: { ...byParticipant, result: { contains: 'positive' } },
      }),
      this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.referral.count({
        where: { status: 'PENDING', ...byParticipant },
      }),
      this.prisma.community.count(),
      this.prisma.outreach.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      mayReadPhi
        ? this.prisma.participant.findMany({
            where: participantWhere,
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              registrationId: true,
              nationalId: true,
              gender: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    return {
      totalParticipants,
      totalScreenings,
      positiveScreenings,
      highRiskCases: positiveScreenings,
      pendingApprovals,
      activeReferrals,
      totalCommunities,
      totalOutreaches,
      activeProjects,
      pendingFollowUps: 0,
      recentParticipants,
    };
  }
}
