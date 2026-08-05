import { OutreachService } from './outreach.service';
export declare class OutreachController {
    private readonly outreachService;
    constructor(outreachService: OutreachService);
    getAllOutreaches(): Promise<({
        tasks: ({
            volunteer: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            hoursLogged: number;
            outreachId: string;
            volunteerId: string;
        })[];
        location: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            address: string | null;
            lga: string | null;
            state: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        date: Date;
        locationId: string;
        title: string;
        attendance: number;
    })[]>;
    getOutreach(id: string): Promise<{
        tasks: ({
            volunteer: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            hoursLogged: number;
            outreachId: string;
            volunteerId: string;
        })[];
        location: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            address: string | null;
            lga: string | null;
            state: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        date: Date;
        locationId: string;
        title: string;
        attendance: number;
    }>;
    createOutreach(body: {
        title: string;
        locationId?: string;
        date: string;
        description?: string;
    }): Promise<{
        location: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            address: string | null;
            lga: string | null;
            state: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        date: Date;
        locationId: string;
        title: string;
        attendance: number;
    }>;
    assignVolunteerTask(outreachId: string, body: {
        volunteerId: string;
        title: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        hoursLogged: number;
        outreachId: string;
        volunteerId: string;
    }>;
    logVolunteerHours(taskId: string, body: {
        hours: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        hoursLogged: number;
        outreachId: string;
        volunteerId: string;
    }>;
}
