import { PrismaService } from '../prisma/prisma.service';
export declare class ReferralsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<({
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
    updateStatus(id: string, status: string): Promise<{
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
