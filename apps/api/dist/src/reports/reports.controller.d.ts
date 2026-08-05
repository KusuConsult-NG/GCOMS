import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSummary(): Promise<{
        generatedAt: Date;
        totalScreenings: number;
        positiveScreenings: number;
        totalPatients: number;
        totalOutreaches: number;
        communitiesCovered: number;
        reachStats: {
            awareness: number;
            screenings: number;
            navigation: number;
            referrals: number;
            activeReferrals: number;
        };
    }>;
    exportData(): Promise<{
        ID: string;
        CancerType: string;
        Result: string;
        RiskScore: number | null;
        Participant: string;
        NationalID: string;
        Gender: string;
        ConductedBy: string;
        Date: Date;
    }[]>;
}
