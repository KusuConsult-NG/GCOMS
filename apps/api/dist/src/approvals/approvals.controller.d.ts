import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    createRequest(data: any, req: any): Promise<{
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
    getRequests(req: any): Promise<({
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
    getPendingRequests(req: any): Promise<({
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
    resolveRequest(id: string, data: {
        status: string;
    }, req: any): Promise<{
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
