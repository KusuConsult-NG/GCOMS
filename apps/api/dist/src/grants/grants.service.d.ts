import { PrismaService } from '../prisma/prisma.service';
export declare class GrantsService {
    private prisma;
    constructor(prisma: PrismaService);
    createGrant(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorName: string;
        grantName: string;
        amount: number;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
    }>;
    getGrants(): Promise<({
        managedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorName: string;
        grantName: string;
        amount: number;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
    })[]>;
}
