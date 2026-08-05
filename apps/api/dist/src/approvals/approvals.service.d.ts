import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ApprovalsService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    createRequest(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
        title: string;
        resourceType: string;
        resourceId: string | null;
        comments: string | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    getPendingRequests(): Promise<({
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
        description: string | null;
        title: string;
        resourceType: string;
        resourceId: string | null;
        comments: string | null;
        requestedById: string;
        approvedById: string | null;
    })[]>;
    resolveRequest(id: string, status: string, executiveId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
        title: string;
        resourceType: string;
        resourceId: string | null;
        comments: string | null;
        requestedById: string;
        approvedById: string | null;
    }>;
}
