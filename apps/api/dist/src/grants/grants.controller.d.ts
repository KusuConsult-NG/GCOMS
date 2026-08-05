import { GrantsService } from './grants.service';
export declare class GrantsController {
    private readonly grantsService;
    constructor(grantsService: GrantsService);
    createGrant(data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorName: string;
        grantName: string;
        amount: number;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
    }>;
    getGrants(req: any): Promise<({
        managedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorName: string;
        grantName: string;
        amount: number;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
    })[]>;
}
