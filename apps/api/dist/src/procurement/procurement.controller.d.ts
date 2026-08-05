import { ProcurementService } from './procurement.service';
export declare class ProcurementController {
    private readonly procurementService;
    constructor(procurementService: ProcurementService);
    createOrder(data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        requestedById: string;
        itemName: string;
        quantity: number;
        estimatedCost: number;
        vendor: string;
    }>;
    getOrders(req: any): Promise<({
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
        requestedById: string;
        itemName: string;
        quantity: number;
        estimatedCost: number;
        vendor: string;
    })[]>;
}
