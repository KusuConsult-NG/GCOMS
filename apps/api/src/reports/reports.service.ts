import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { money, sumBy } from '../common/money';

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

    const positiveScreenings = allScreenings.filter(
      (s) => s.result && s.result.toLowerCase().includes('positive'),
    ).length;

    /*
     * `awareness` used to be `totalOutreaches * 50` with the comment "Estimated
     * reach: 50 per outreach", and the reports screen rendered it as "Total
     * Community Reach". Fifty is not a measurement — it is a number somebody
     * chose — and multiplying by it turns a count of outreach events into a
     * figure about people that no outreach event actually recorded. A report is
     * the last place to do that, so what is returned is the count itself.
     */
    return {
      generatedAt: new Date(),
      totalScreenings,
      positiveScreenings,
      totalPatients,
      totalOutreaches,
      totalReferrals,
      activeReferrals,
      totalNavigationEvents,
      communitiesCovered,
    };
  }

  /**
   * Every screening, with the participant's name and national id.
   *
   * This is the largest PHI disclosure the system performs — one request
   * returns the identified register — and it left no trace. PhiAccessService
   * writes a PHI_ACCESS_OVERRIDE row when a clinician opens a single record
   * outside their caseload; downloading every record wrote nothing at all, so
   * the access an audit would most want to find was the one access it could
   * not see.
   *
   * The roles are unchanged: EXECUTIVE, SYSTEM_ADMIN and DATA_OFFICER are all
   * in PHI_UNSCOPED_ROLES and may read identified records. What is added is the
   * record that they did.
   */
  async exportReportData(actorId: string) {
    const screenings = await this.prisma.screening.findMany({
      include: {
        participant: {
          select: {
            firstName: true,
            lastName: true,
            registrationId: true,
            nationalId: true,
            gender: true,
          },
        },
        conductedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PHI_BULK_EXPORT',
        newData: JSON.stringify({
          screenings: screenings.length,
          includes: ['participantName', 'nationalId', 'gender', 'result'],
        }),
        userId: actorId,
      },
    });

    return screenings.map((s) => ({
      ID: s.id,
      CancerType: s.cancerType,
      Result: s.result,
      RiskScore: s.riskScore,
      Participant:
        `${s.participant?.firstName || ''} ${s.participant?.lastName || ''}`.trim(),
      NationalID: s.participant?.nationalId || '',
      Gender: s.participant?.gender || '',
      ConductedBy: s.conductedBy
        ? `${s.conductedBy.firstName} ${s.conductedBy.lastName}`
        : 'N/A',
      Date: s.createdAt,
    }));
  }

  async getParticipantReport() {
    return this.prisma.participant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        screenings: {
          select: { cancerType: true, result: true, createdAt: true },
        },
        referrals: { select: { referredTo: true, status: true } },
        navigationEvents: { select: { eventType: true, date: true } },
      },
    });
  }

  /**
   * Approved transactions only, the same rule FinanceService.getSummary
   * enforces and for the same reason: a report that counts a requisition
   * nobody approved as money spent — and a refused one forever — is not a
   * report of anything.
   *
   * Note this method and getParticipantReport have no route. They are reachable
   * from nothing, which is why the rule had not been applied here; leaving a
   * known-wrong total in place for whoever wires them up is the trap.
   */
  async getFinancialReport() {
    const [income, expenses, grants] = await Promise.all([
      this.prisma.financeTransaction.findMany({
        where: { type: 'INCOME', status: 'APPROVED' },
      }),
      this.prisma.financeTransaction.findMany({
        where: { type: 'EXPENSE', status: 'APPROVED' },
      }),
      this.prisma.grant.findMany({
        select: { grantName: true, amount: true, status: true },
      }),
    ]);

    const income$ = sumBy(income, (t) => t.amount);
    const expenses$ = sumBy(expenses, (t) => t.amount);
    const totalIncome = money(income$);
    const totalExpenses = money(expenses$);
    const totalGrantFunding = money(sumBy(grants, (g) => g.amount));

    return {
      totalIncome,
      totalExpenses,
      netBalance: money(income$.sub(expenses$)),
      totalGrantFunding,
      transactions: [...income, ...expenses].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      grants,
    };
  }
}
