import { PrismaService } from '../prisma/prisma.service';
export declare class LocationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        lga: string | null;
        state: string | null;
    }[]>;
    create(data: {
        name: string;
        address?: string;
        lga?: string;
        state?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        lga: string | null;
        state: string | null;
    }>;
}
