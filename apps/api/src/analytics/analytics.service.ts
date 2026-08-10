import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { money, sumBy } from '../common/money';

/**
 * Programme reach in one Local Government Area.
 *
 * Every figure is a count of rows that exist. The executive dashboard used to
 * render this table from six hardcoded objects — "Bassa, Optimal Capacity, 120
 * referrals, 95%" — which is a decision-support screen showing numbers nobody
 * measured. There is no `status` and no `score` here because neither is
 * recorded anywhere: a status would have to be defined before it could be
 * reported, and the "score" was not a quantity at all.
 */
export type LgaCoverage = {
  lga: string;
  participants: number;
  screenings: number;
  positiveScreenings: number;
  referrals: number;
  pendingReferrals: number;
  communities: number;
  /** Most recent registration in this LGA, or null where there are none. */
  lastRegistration: string | null;
};

/** Shape of the grouped query below, before communities are folded in. */
type ParticipantRollup = {
  lga: string;
  participants: number;
  screenings: number;
  positiveScreenings: number;
  referrals: number;
  pendingReferrals: number;
  lastRegistration: Date | null;
};

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Coverage per LGA.
   *
   * One grouped query rather than loading the tables and counting in JS, which
   * is what getSummary below does with screenings. That pattern is tolerable for
   * a handful of scalar totals and is not for a per-LGA breakdown across three
   * tables — it would pull every screening and referral row to produce twenty
   * numbers.
   *
   * `LOWER(...) LIKE '%positive%'` rather than an equality test because the
   * result column is free text and three different screens write 'POSITIVE',
   * 'Positive' and 'positive' into it. That is the same match getSummary makes,
   * and the same one the move to Postgres had to fix when case-sensitivity
   * changed under it.
   *
   * Communities are counted separately and merged, so an LGA that has been
   * mapped but not yet visited appears with zeroes instead of vanishing. An
   * empty row is a real answer to "where are we not working".
   */
  async getLgaCoverage(): Promise<LgaCoverage[]> {
    const [rollup, communities] = await Promise.all([
      this.prisma.$queryRaw<ParticipantRollup[]>`
        SELECT
          p.lga AS lga,
          COUNT(DISTINCT p.id)::int AS participants,
          COUNT(DISTINCT s.id)::int AS screenings,
          (COUNT(DISTINCT s.id) FILTER (
            WHERE LOWER(s.result) LIKE '%positive%'
          ))::int AS "positiveScreenings",
          COUNT(DISTINCT r.id)::int AS referrals,
          (COUNT(DISTINCT r.id) FILTER (
            WHERE r.status = 'PENDING'
          ))::int AS "pendingReferrals",
          MAX(p."createdAt") AS "lastRegistration"
        FROM "Participant" p
        LEFT JOIN "Screening" s ON s."participantId" = p.id
        LEFT JOIN "Referral" r ON r."participantId" = p.id
        WHERE p.lga IS NOT NULL AND TRIM(p.lga) <> ''
        GROUP BY p.lga
      `,
      this.prisma.community.groupBy({
        by: ['lga'],
        _count: { _all: true },
      }),
    ]);

    const byLga = new Map<string, LgaCoverage>();
    for (const row of rollup) {
      byLga.set(row.lga, {
        lga: row.lga,
        participants: row.participants,
        screenings: row.screenings,
        positiveScreenings: row.positiveScreenings,
        referrals: row.referrals,
        pendingReferrals: row.pendingReferrals,
        communities: 0,
        lastRegistration: row.lastRegistration?.toISOString() ?? null,
      });
    }

    for (const row of communities) {
      const existing = byLga.get(row.lga);
      if (existing) {
        existing.communities = row._count._all;
        continue;
      }
      byLga.set(row.lga, {
        lga: row.lga,
        participants: 0,
        screenings: 0,
        positiveScreenings: 0,
        referrals: 0,
        pendingReferrals: 0,
        communities: row._count._all,
        lastRegistration: null,
      });
    }

    // Busiest first, then alphabetically so the untouched LGAs at the bottom
    // keep a stable order rather than shuffling between requests.
    return [...byLga.values()].sort(
      (a, b) => b.participants - a.participants || a.lga.localeCompare(b.lga),
    );
  }

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

    const positiveScreenings = allScreenings.filter(
      (s) => s.result && s.result.toLowerCase().includes('positive'),
    ).length;
    const totalFunding = money(sumBy(allGrants, (g) => g.amount));

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
