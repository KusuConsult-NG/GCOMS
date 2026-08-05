import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
export declare class ClinicalEncountersService {
    private prisma;
    private phi;
    constructor(prisma: PrismaService, phi: PhiAccessService);
    createEncounter(data: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicianId: string;
        participantId: string;
        notes: string;
        prognosis: string | null;
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
        clinicianId: string;
        participantId: string;
        notes: string;
        prognosis: string | null;
    })[]>;
    editEncounter(id: string, newNotes: string, userId: string, actor: PhiActor): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicianId: string;
        participantId: string;
        notes: string;
        prognosis: string | null;
    }>;
    assignPatient(data: any, assignedBy: string): Promise<{
        id: string;
        updatedAt: Date;
        status: string;
        clinicianId: string;
        participantId: string;
        assignedAt: Date;
    }>;
    getAssignments(clinicianId?: string): Promise<({
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
        updatedAt: Date;
        status: string;
        clinicianId: string;
        participantId: string;
        assignedAt: Date;
    })[]>;
}
