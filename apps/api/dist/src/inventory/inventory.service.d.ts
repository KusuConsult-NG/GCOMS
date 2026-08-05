import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    createInventoryItem(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string;
        location: string;
        category: string;
        itemName: string;
        quantity: number;
        unit: string;
    }>;
    getInventoryItems(): Promise<({
        managedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string;
        location: string;
        category: string;
        itemName: string;
        quantity: number;
        unit: string;
    })[]>;
    updateInventoryItem(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string;
        location: string;
        category: string;
        itemName: string;
        quantity: number;
        unit: string;
    }>;
}
