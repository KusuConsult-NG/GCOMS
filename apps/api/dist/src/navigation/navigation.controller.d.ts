import { NavigationService } from './navigation.service';
export declare class NavigationController {
    private readonly navigationService;
    constructor(navigationService: NavigationService);
    getTimeline(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participantId: string;
        notes: string | null;
        date: Date;
        eventType: string;
    }[]>;
    addEvent(participantId: string, body: {
        eventType: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participantId: string;
        notes: string | null;
        date: Date;
        eventType: string;
    }>;
}
