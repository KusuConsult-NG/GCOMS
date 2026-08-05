import { HrService } from './hr.service';
export declare class HrController {
    private readonly hrService;
    constructor(hrService: HrService);
    createStaffRecord(data: any, req: any): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string | null;
        userId: string;
        department: string;
        employmentType: string;
    }>;
    createStaffRecordAlias(data: any, req: any): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string | null;
        userId: string;
        department: string;
        employmentType: string;
    }>;
    getStaffRecords(req: any): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        managedBy: {
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string | null;
        userId: string;
        department: string;
        employmentType: string;
    })[]>;
    getStaffRecordsAlias(req: any): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        managedBy: {
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string | null;
        userId: string;
        department: string;
        employmentType: string;
    })[]>;
}
