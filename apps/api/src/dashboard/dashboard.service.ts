import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalParticipants,
      totalScreenings,
      allScreenings,
      pendingApprovals,
      activeReferrals,
      totalCommunities,
      totalOutreaches,
      activeProjects,
      recentParticipants,
    ] = await Promise.all([
      this.prisma.participant.count(),
      this.prisma.screening.count(),
      this.prisma.screening.findMany({ select: { result: true } }),
      this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.referral.count({ where: { status: 'PENDING' } }),
      this.prisma.community.count(),
      this.prisma.outreach.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.participant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nationalId: true,
          gender: true,
          createdAt: true,
        },
      }),
    ]);

    const positiveScreenings = allScreenings.filter(s => s.result && s.result.toLowerCase().includes('positive')).length;

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
