import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveSummary() {
    const [
      totalScreenings,
      allScreenings,
      totalPatients,
      totalOutreaches,
      totalReferrals,
      activeReferrals,
      totalNavigationEvents,
      communitiesCovered,
    ] = await Promise.all([
      this.prisma.screening.count(),
      this.prisma.screening.findMany({ select: { result: true } }),
      this.prisma.participant.count(),
      this.prisma.outreach.count(),
      this.prisma.referral.count(),
      this.prisma.referral.count({ where: { status: 'PENDING' } }),
      this.prisma.navigationEvent.count(),
      this.prisma.community.count(),
    ]);

    const positiveScreenings = allScreenings.filter(s => s.result && s.result.toLowerCase().includes('positive')).length;

    return {
      generatedAt: new Date(),
      totalScreenings,
      positiveScreenings,
      totalPatients,
      totalOutreaches,
      communitiesCovered,
      reachStats: {
        awareness: totalOutreaches * 50, // Estimated reach: 50 per outreach
        screenings: totalScreenings,
        navigation: totalNavigationEvents,
        referrals: totalReferrals,
        activeReferrals,
      },
    };
  }

  async exportReportData() {
    const screenings = await this.prisma.screening.findMany({
      include: {
        participant: {
          select: { firstName: true, lastName: true, nationalId: true, gender: true },
        },
        conductedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return screenings.map(s => ({
      ID: s.id,
      CancerType: s.cancerType,
      Result: s.result,
      RiskScore: s.riskScore,
      Participant: `${s.participant?.firstName || ''} ${s.participant?.lastName || ''}`.trim(),
      NationalID: s.participant?.nationalId || '',
      Gender: s.participant?.gender || '',
      ConductedBy: s.conductedBy ? `${s.conductedBy.firstName} ${s.conductedBy.lastName}` : 'N/A',
      Date: s.createdAt,
    }));
  }

  async getParticipantReport() {
    return this.prisma.participant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        screenings: { select: { cancerType: true, result: true, createdAt: true } },
        referrals: { select: { referredTo: true, status: true } },
        navigationEvents: { select: { eventType: true, date: true } },
      },
    });
  }

  async getFinancialReport() {
    const [income, expenses, grants] = await Promise.all([
      this.prisma.financeTransaction.findMany({ where: { type: 'INCOME' } }),
      this.prisma.financeTransaction.findMany({ where: { type: 'EXPENSE' } }),
      this.prisma.grant.findMany({ select: { grantName: true, amount: true, status: true } }),
    ]);

    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const totalGrantFunding = grants.reduce((s, g) => s + (g.amount || 0), 0);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalGrantFunding,
      transactions: [...income, ...expenses].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      grants,
    };
  }
}
