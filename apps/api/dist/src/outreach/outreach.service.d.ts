import { PrismaService } from '../prisma/prisma.service';
export declare class OutreachService {
    private prisma;
    constructor(prisma: PrismaService);
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
        locationId: string;
        title: string;
        date: Date;
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
        locationId: string;
        title: string;
        date: Date;
        attendance: number;
    }>;
    createOutreach(data: {
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
        locationId: string;
        title: string;
        date: Date;
        attendance: number;
    }>;
    assignVolunteerTask(outreachId: string, volunteerId: string, title: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        hoursLogged: number;
        outreachId: string;
        volunteerId: string;
    }>;
    logVolunteerHours(taskId: string, hours: number): Promise<{
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
