import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class BackgroundSchedulerService implements OnModuleInit {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    runSchedulerChecks(): Promise<void>;
}
