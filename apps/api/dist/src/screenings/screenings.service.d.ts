import { PrismaService } from '../prisma/prisma.service';
export declare class ScreeningsService {
    private prisma;
    constructor(prisma: PrismaService);
    calculateRiskScore(data: {
        cancerType: string;
        result: string;
        participantId: string;
    }): Promise<number>;
    createScreening(data: any, userId: string): Promise<{
        participant: {
            firstName: string;
            lastName: string;
            nationalId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string;
        cancerType: string;
        riskScore: number | null;
        locationId: string | null;
        participantId: string;
        conductedById: string;
    }>;
    getScreenings(participantId: string): Promise<({
        conductedBy: {
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string;
        cancerType: string;
        riskScore: number | null;
        locationId: string | null;
        participantId: string;
        conductedById: string;
    })[]>;
}
