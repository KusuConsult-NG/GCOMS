import { ClinicalEncountersService } from './clinical-encounters.service';
import { PhiAccessService } from '../phi/phi-access.service';
export declare class ClinicalEncountersController {
    private readonly encountersService;
    private readonly phi;
    constructor(encountersService: ClinicalEncountersService, phi: PhiAccessService);
    createEncounter(data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicianId: string;
        participantId: string;
        notes: string;
        prognosis: string | null;
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
        clinicianId: string;
        participantId: string;
        notes: string;
        prognosis: string | null;
    })[]>;
    editEncounter(id: string, data: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clinicianId: string;
        participantId: string;
        notes: string;
        prognosis: string | null;
    }>;
    assignPatient(data: any, req: any): Promise<{
        id: string;
        updatedAt: Date;
        status: string;
        clinicianId: string;
        participantId: string;
        assignedAt: Date;
    }>;
    getAssignments(req: any): Promise<({
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
