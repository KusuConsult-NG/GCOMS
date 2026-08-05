import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getExecutiveSummary(): Promise<{
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
    exportReportData(): Promise<{
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
    getParticipantReport(): Promise<({
        screenings: {
            createdAt: Date;
            result: string;
            cancerType: string;
        }[];
        referrals: {
            status: string;
            referredTo: string;
        }[];
        navigationEvents: {
            date: Date;
            eventType: string;
        }[];
    } & {
        id: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
        registeredById: string;
        nationalId: string;
        dateOfBirth: Date;
        gender: string;
        phoneNumber: string | null;
        address: string | null;
        consentGiven: boolean;
    })[]>;
    getFinancialReport(): Promise<{
        totalIncome: number;
        totalExpenses: number;
        netBalance: number;
        totalGrantFunding: number;
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: number;
            status: string;
            description: string;
            requestedById: string;
            type: string;
            category: string;
        }[];
        grants: {
            grantName: string;
            amount: number;
            status: string;
        }[];
    }>;
}
