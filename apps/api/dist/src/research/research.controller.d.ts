import { ResearchService } from './research.service';
export declare class ResearchController {
    private readonly researchService;
    constructor(researchService: ResearchService);
    getProjects(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        progress: number;
    }[]>;
    createProject(body: {
        title: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        progress: number;
    }>;
    updateProgress(id: string, body: {
        progress: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        progress: number;
    }>;
}
