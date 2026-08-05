import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
export declare class FollowUpService {
    private prisma;
    private phi;
    constructor(prisma: PrismaService, phi: PhiAccessService);
    getAll(status?: string, scope?: Prisma.ParticipantWhereInput): Promise<({
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
        clinicianId: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
    })[]>;
    getOne(id: string, scope?: Prisma.ParticipantWhereInput): Promise<{
        participant: {
            id: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
            updatedAt: Date;
            registeredById: string;
            nationalId: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string | null;
            address: string | null;
            consentGiven: boolean;
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
        clinicianId: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
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
        clinicianId: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
    }>;
    updateStatus(id: string, status: string, notes: string | undefined, actor: PhiActor): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        clinicianId: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
    }>;
    getUpcoming(days?: number, scope?: Prisma.ParticipantWhereInput): Promise<({
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
        clinicianId: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
    })[]>;
    getMissed(scope?: Prisma.ParticipantWhereInput): Promise<({
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
        clinicianId: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
    })[]>;
    getDashboardStats(scope?: Prisma.ParticipantWhereInput): Promise<{
        scheduled: number;
        completed: number;
        missed: number;
        cancelled: number;
        upcoming: number;
    }>;
}
