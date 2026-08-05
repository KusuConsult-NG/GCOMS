import { PrismaService } from '../prisma/prisma.service';
export declare class FinanceService {
    private prisma;
    constructor(prisma: PrismaService);
    createTransaction(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: number;
        status: string;
        description: string;
        requestedById: string;
        type: string;
        category: string;
    }>;
    getTransactions(): Promise<({
        requestedBy: {
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: number;
        status: string;
        description: string;
        requestedById: string;
        type: string;
        category: string;
    })[]>;
}
