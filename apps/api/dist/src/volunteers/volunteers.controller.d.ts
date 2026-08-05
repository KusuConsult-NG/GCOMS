import { VolunteersService } from './volunteers.service';
export declare class VolunteersController {
    private readonly volunteersService;
    constructor(volunteersService: VolunteersService);
    getVolunteers(): Promise<({
        volunteerTasks: ({
            outreach: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                date: Date;
                locationId: string;
                title: string;
                attendance: number;
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
    } & {
        id: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    assignTask(body: {
        outreachId: string;
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
    logHours(taskId: string, body: {
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
