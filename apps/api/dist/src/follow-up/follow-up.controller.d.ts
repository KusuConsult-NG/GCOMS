import { FollowUpService } from './follow-up.service';
import { PhiAccessService } from '../phi/phi-access.service';
export declare class FollowUpController {
    private readonly followUpService;
    private readonly phi;
    constructor(followUpService: FollowUpService, phi: PhiAccessService);
    getAll(req: any, status?: string): Promise<({
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
    getDashboardStats(req: any): Promise<{
        scheduled: number;
        completed: number;
        missed: number;
        cancelled: number;
        upcoming: number;
    }>;
    getUpcoming(req: any, days?: string): Promise<({
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
    getMissed(req: any): Promise<({
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
    getOne(id: string, req: any): Promise<{
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
    create(body: {
        participantId: string;
        clinicianId: string;
        scheduledDate: string;
        notes?: string;
    }, req: any): Promise<{
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
    updateStatus(id: string, body: {
        status: string;
        notes?: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        clinicianId: string;
        scheduledDate: Date;
        participantId: string;
        notes: string | null;
    }>;
}
