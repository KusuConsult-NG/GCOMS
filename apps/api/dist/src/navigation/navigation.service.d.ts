import { PrismaService } from '../prisma/prisma.service';
export declare class NavigationService {
    private prisma;
    constructor(prisma: PrismaService);
    getNavigationTimeline(participantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        participantId: string;
        notes: string | null;
        eventType: string;
    }[]>;
    addNavigationEvent(participantId: string, eventType: string, notes?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        participantId: string;
        notes: string | null;
        eventType: string;
    }>;
}
