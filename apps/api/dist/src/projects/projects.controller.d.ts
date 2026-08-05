import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    createProject(data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
        projectName: string;
        description: string;
        budget: number;
    }>;
    getProjects(req: any): Promise<({
        managedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        status: string;
        managedById: string;
        projectName: string;
        description: string;
        budget: number;
    })[]>;
}
