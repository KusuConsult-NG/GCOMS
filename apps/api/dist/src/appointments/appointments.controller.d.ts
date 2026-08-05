import { AppointmentsService } from './appointments.service';
export declare class AppointmentsController {
    private readonly apptService;
    constructor(apptService: AppointmentsService);
    getAll(status?: string, req?: any): Promise<({
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
        participantId: string;
        notes: string | null;
        clinicianId: string;
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
        participantId: string;
        notes: string | null;
        clinicianId: string;
        type: string;
        scheduledAt: Date;
    }>;
    updateStatus(id: string, body: {
        status: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        notes: string | null;
        clinicianId: string;
        type: string;
        scheduledAt: Date;
    }>;
}
