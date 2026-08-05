import { PrismaService } from '../prisma/prisma.service';
export declare class FollowUpService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(status?: string, clinicianId?: string): Promise<({
        participant: {
            id: string;
            firstName: string;
            lastName: string;
            nationalId: string;
            gender: string;
            phoneNumber: string | null;
        };
        clinician: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
        clinicianId: string;
    })[]>;
    getOne(id: string): Promise<{
        participant: {
            id: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
            updatedAt: Date;
            nationalId: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string | null;
            address: string | null;
            consentGiven: boolean;
            registeredById: string;
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
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
        clinicianId: string;
    }>;
    create(data: {
        participantId: string;
        clinicianId: string;
        scheduledDate: string;
        notes?: string;
    }): Promise<{
        participant: {
            firstName: string;
            lastName: string;
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
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
        clinicianId: string;
    }>;
    updateStatus(id: string, status: string, notes?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
        clinicianId: string;
    }>;
    getUpcoming(days?: number): Promise<({
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
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
        clinicianId: string;
    })[]>;
    getMissed(): Promise<({
        participant: {
            firstName: string;
            lastName: string;
            nationalId: string;
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
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
        clinicianId: string;
    })[]>;
    getDashboardStats(): Promise<{
        scheduled: number;
        completed: number;
        missed: number;
        cancelled: number;
        upcoming: number;
    }>;
}
