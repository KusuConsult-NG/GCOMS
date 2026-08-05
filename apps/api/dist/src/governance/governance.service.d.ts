import { PrismaService } from '../prisma/prisma.service';
export declare class GovernanceService {
    private prisma;
    constructor(prisma: PrismaService);
    scheduleMeeting(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        meetingDate: Date;
        minutesUrl: string | null;
        organizedById: string;
    }>;
    getMeetings(): Promise<({
        organizedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        meetingDate: Date;
        minutesUrl: string | null;
        organizedById: string;
    })[]>;
}
