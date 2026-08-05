import { PrismaService } from '../prisma/prisma.service';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    createDocumentRecord(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        documentType: string;
        url: string;
        version: string;
        uploadedById: string;
    }>;
    getDocumentRecords(): Promise<({
        uploadedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        documentType: string;
        url: string;
        version: string;
        uploadedById: string;
    })[]>;
}
