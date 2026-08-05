import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
export declare class ReferralsService {
    private prisma;
    private phi;
    constructor(prisma: PrismaService, phi: PhiAccessService);
    getAll(scope?: Prisma.ParticipantWhereInput): Promise<({
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
        referredBy: {
            id: string;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        referredTo: string;
        reason: string;
        referredById: string;
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
        referredBy: {
            id: string;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        referredTo: string;
        reason: string;
        referredById: string;
    }>;
    create(data: {
        participantId: string;
        referredTo: string;
        reason: string;
        referredById?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        referredTo: string;
        reason: string;
        referredById: string;
    }>;
    updateStatus(id: string, status: string, actor: PhiActor): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        referredTo: string;
        reason: string;
        referredById: string;
    }>;
}
