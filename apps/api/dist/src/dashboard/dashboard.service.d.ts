import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
export declare class DashboardService {
    private prisma;
    private phi;
    constructor(prisma: PrismaService, phi: PhiAccessService);
    getStats(actor: PhiActor): Promise<{
        totalParticipants: number;
        totalScreenings: number;
        positiveScreenings: number;
        highRiskCases: number;
        pendingApprovals: number;
        activeReferrals: number;
        totalCommunities: number;
        totalOutreaches: number;
        activeProjects: number;
        pendingFollowUps: number;
        recentParticipants: never[] | {
            id: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
            nationalId: string;
            gender: string;
        }[];
    }>;
}
