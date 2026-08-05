import { ClinicalEncountersService } from './clinical-encounters.service';
export declare class ClinicalEncountersController {
    private readonly encountersService;
    constructor(encountersService: ClinicalEncountersService);
    createEncounter(data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participantId: string;
        notes: string;
        prognosis: string | null;
        clinicianId: string;
    }>;
    getEncounters(id: string): Promise<({
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
    editEncounter(id: string, data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participantId: string;
        notes: string;
        prognosis: string | null;
        clinicianId: string;
    }>;
    assignPatient(data: any, req: any): Promise<{
        id: string;
        updatedAt: Date;
        status: string;
        participantId: string;
        clinicianId: string;
        assignedAt: Date;
    }>;
    getAssignments(req: any): Promise<({
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
