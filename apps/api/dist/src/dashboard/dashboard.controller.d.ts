import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(req: any): Promise<{
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
