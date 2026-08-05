import { PrismaService } from '../prisma/prisma.service';
export declare class SystemAdminService {
    private prisma;
    constructor(prisma: PrismaService);
    setConfig(key: string, value: string): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }>;
    getConfigs(): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }[]>;
}
