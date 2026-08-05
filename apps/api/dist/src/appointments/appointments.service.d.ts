import { PrismaService } from '../prisma/prisma.service';
export declare class AppointmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        participantId: string;
        clinicianId: string;
        scheduledAt: string;
        type?: string;
        notes?: string;
    }): Promise<{
        participant: {
            firstName: string;
            lastName: string;
            phoneNumber: string | null;
        };
        clinician: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        notes: string | null;
        clinicianId: string;
        type: string;
        scheduledAt: Date;
    }>;
    findAll(status?: string, clinicianId?: string): Promise<({
        participant: {
            firstName: string;
            lastName: string;
            nationalId: string;
            phoneNumber: string | null;
        };
        clinician: {
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        notes: string | null;
        clinicianId: string;
        type: string;
        scheduledAt: Date;
    })[]>;
    updateStatus(id: string, status: string, notes?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        notes: string | null;
        clinicianId: string;
        type: string;
        scheduledAt: Date;
    }>;
}
