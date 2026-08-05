import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    createProject(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
        projectName: string;
        description: string;
        budget: number;
    }>;
    getProjects(): Promise<({
        managedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
        projectName: string;
        description: string;
        budget: number;
    })[]>;
}
