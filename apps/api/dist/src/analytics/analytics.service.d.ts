import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSummary(): Promise<{
        totalScreenings: number;
        positiveScreenings: number;
        activeProjects: number;
        totalFunding: number;
        pendingApprovals: number;
        totalParticipants: number;
        activeReferrals: number;
        communitiesCovered: number;
        totalOutreaches: number;
        researchProjects: number;
        totalStaff: number;
        patientsUnderNavigation: number;
    }>;
}
