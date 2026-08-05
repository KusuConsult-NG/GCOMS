import { AppointmentsService } from './appointments.service';
import { PhiAccessService } from '../phi/phi-access.service';
export declare class AppointmentsController {
    private readonly apptService;
    private readonly phi;
    constructor(apptService: AppointmentsService, phi: PhiAccessService);
    getAll(req: any, status?: string): Promise<({
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
    create(body: {
        participantId: string;
        clinicianId?: string;
        scheduledAt: string;
        type?: string;
        notes?: string;
    }, req: any): Promise<{
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
    updateStatus(id: string, body: {
        status: string;
        notes?: string;
    }, req: any): Promise<{
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
