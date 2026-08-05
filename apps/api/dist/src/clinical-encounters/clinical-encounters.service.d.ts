import { PrismaService } from '../prisma/prisma.service';
export declare class ClinicalEncountersService {
    private prisma;
    constructor(prisma: PrismaService);
    createEncounter(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participantId: string;
        notes: string;
        prognosis: string | null;
        clinicianId: string;
    }>;
    getEncounters(participantId: string): Promise<({
        clinician: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participantId: string;
        notes: string;
        prognosis: string | null;
        clinicianId: string;
    })[]>;
    editEncounter(id: string, newNotes: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participantId: string;
        notes: string;
        prognosis: string | null;
        clinicianId: string;
    }>;
    assignPatient(data: any, assignedBy: string): Promise<{
        id: string;
        updatedAt: Date;
        status: string;
        participantId: string;
        clinicianId: string;
        assignedAt: Date;
    }>;
    getAssignments(clinicianId?: string): Promise<({
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
        updatedAt: Date;
        status: string;
        participantId: string;
        clinicianId: string;
        assignedAt: Date;
    })[]>;
}
