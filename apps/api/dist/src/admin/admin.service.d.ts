import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    createFacilityRequest(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string;
        requestedById: string;
        facilityName: string;
        requestType: string;
    }>;
    getFacilityRequests(): Promise<({
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
