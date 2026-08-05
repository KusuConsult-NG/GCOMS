import { PrismaService } from '../prisma/prisma.service';
export declare class HrService {
    private prisma;
    constructor(prisma: PrismaService);
    createStaffRecord(data: any, hrManagerId: string): Promise<{
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
    getStaffRecords(): Promise<({
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
