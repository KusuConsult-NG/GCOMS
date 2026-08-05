import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    createFacilityRequest(data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string;
        requestedById: string;
        facilityName: string;
        requestType: string;
    }>;
    getFacilityRequests(req: any): Promise<({
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
        description: string;
        requestedById: string;
        facilityName: string;
        requestType: string;
    })[]>;
}
