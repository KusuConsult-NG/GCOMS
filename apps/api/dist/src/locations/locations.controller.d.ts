import { LocationsService } from './locations.service';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    getAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        lga: string | null;
        state: string | null;
    }[]>;
    create(body: {
        name: string;
        lga: string;
        state?: string;
        type?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        lga: string | null;
        state: string | null;
    }>;
}
