import { PrismaService } from '../prisma/prisma.service';
export declare class VolunteersService {
    private prisma;
    constructor(prisma: PrismaService);
    getVolunteers(): Promise<({
        volunteerTasks: ({
            outreach: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                locationId: string;
                title: string;
                date: Date;
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
    assignTask(data: {
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
    logHours(taskId: string, hours: number): Promise<{
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
