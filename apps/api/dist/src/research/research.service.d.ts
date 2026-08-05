import { PrismaService } from '../prisma/prisma.service';
export declare class ResearchService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllProjects(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        progress: number;
    }[]>;
    createProject(title: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        progress: number;
    }>;
    updateProgress(id: string, progress: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        progress: number;
    }>;
}
