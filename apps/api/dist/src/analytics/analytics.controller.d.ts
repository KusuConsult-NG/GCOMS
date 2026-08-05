import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getSummary(req: any): Promise<{
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
