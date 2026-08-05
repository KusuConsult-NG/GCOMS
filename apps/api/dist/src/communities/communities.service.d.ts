import { PrismaService } from '../prisma/prisma.service';
export declare class CommunitiesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lga: string;
        state: string;
        population: number;
        leaderName: string | null;
    }[]>;
    create(data: {
        name: string;
        lga: string;
        state?: string;
        population?: number;
        leaderName?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lga: string;
        state: string;
        population: number;
        leaderName: string | null;
    }>;
}
