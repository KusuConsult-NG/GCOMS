import { PrismaService } from '../prisma/prisma.service';
export declare class ProcurementService {
    private prisma;
    constructor(prisma: PrismaService);
    createOrder(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestedById: string;
        itemName: string;
        quantity: number;
        estimatedCost: number;
        vendor: string;
    }>;
    getOrders(): Promise<({
        requestedBy: {
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestedById: string;
        itemName: string;
        quantity: number;
        estimatedCost: number;
        vendor: string;
    })[]>;
}
