import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
export declare class AppointmentsService {
    private prisma;
    private phi;
    constructor(prisma: PrismaService, phi: PhiAccessService);
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
        clinicianId: string;
        participantId: string;
        notes: string | null;
        type: string;
        scheduledAt: Date;
    }>;
    findAll(status?: string, scope?: Prisma.ParticipantWhereInput): Promise<({
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
        clinicianId: string;
        participantId: string;
        notes: string | null;
        type: string;
        scheduledAt: Date;
    })[]>;
    updateStatus(id: string, status: string, notes: string | undefined, actor: PhiActor): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        clinicianId: string;
        participantId: string;
        notes: string | null;
        type: string;
        scheduledAt: Date;
    }>;
}
