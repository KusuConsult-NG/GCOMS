import { CommunitiesService } from './communities.service';
export declare class CommunitiesController {
    private readonly communitiesService;
    constructor(communitiesService: CommunitiesService);
    getAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lga: string;
        state: string;
        population: number;
        leaderName: string | null;
    }[]>;
    create(body: {
        name: string;
        lga: string;
        state?: string;
        population?: number;
        leaderName?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lga: string;
        state: string;
        population: number;
        leaderName: string | null;
    }>;
}
