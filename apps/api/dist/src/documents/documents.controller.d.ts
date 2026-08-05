import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    createDocumentRecord(data: CreateDocumentDto, req: any): Promise<{
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
