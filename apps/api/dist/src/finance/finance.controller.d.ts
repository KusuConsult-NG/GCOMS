import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    createTransaction(data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: number;
        status: string;
        description: string;
        requestedById: string;
        type: string;
        category: string;
    }>;
    getTransactions(req: any): Promise<({
        requestedBy: {
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: number;
        status: string;
        description: string;
        requestedById: string;
        type: string;
        category: string;
    })[]>;
}
