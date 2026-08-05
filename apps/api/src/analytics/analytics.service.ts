import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [
      totalScreenings,
      allScreenings,
      activeProjects,
      allGrants,
      pendingApprovals,
      totalParticipants,
      activeReferrals,
      communitiesCovered,
      totalOutreaches,
      researchProjects,
      totalStaff,
      patientsUnderNavigation,
    ] = await Promise.all([
      this.prisma.screening.count(),
      this.prisma.screening.findMany({ select: { result: true } }),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.grant.findMany({ select: { amount: true } }),
      this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.participant.count(),
      this.prisma.referral.count({ where: { status: 'PENDING' } }),
      this.prisma.community.count(),
      this.prisma.outreach.count(),
      this.prisma.researchProject.count(),
      this.prisma.staffRecord.count({ where: { status: 'ACTIVE' } }),
      this.prisma.patientAssignment.count({ where: { status: 'ACTIVE' } }),
    ]);

    const positiveScreenings = allScreenings.filter(s => s.result && s.result.toLowerCase().includes('positive')).length;
    const totalFunding = allGrants.reduce((sum, g) => sum + (g.amount || 0), 0);

    return {
      totalScreenings,
      positiveScreenings,
      activeProjects,
      totalFunding,
      pendingApprovals,
      totalParticipants,
      activeReferrals,
      communitiesCovered,
      totalOutreaches,
      researchProjects,
      totalStaff,
      patientsUnderNavigation,
    };
  }
}
