import { ScreeningsService } from './screenings.service';
export declare class ScreeningsController {
    private readonly screeningsService;
    constructor(screeningsService: ScreeningsService);
    createScreening(data: any, req: any): Promise<{
        participant: {
            firstName: string;
            lastName: string;
            nationalId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string;
        cancerType: string;
        riskScore: number | null;
        locationId: string | null;
        participantId: string;
        conductedById: string;
    }>;
    getScreenings(id: string): Promise<({
        conductedBy: {
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string;
        cancerType: string;
        riskScore: number | null;
        locationId: string | null;
        participantId: string;
        conductedById: string;
    })[]>;
}
