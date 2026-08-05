import { ReferralsService } from './referrals.service';
import { PhiAccessService } from '../phi/phi-access.service';
export declare class ReferralsController {
    private readonly referralsService;
    private readonly phi;
    constructor(referralsService: ReferralsService, phi: PhiAccessService);
    getAll(req: any): Promise<({
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
    create(body: {
        participantId: string;
        referredTo: string;
        reason: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        participantId: string;
        referredTo: string;
        reason: string;
        referredById: string;
    }>;
    updateStatus(id: string, body: {
        status: string;
    }, req: any): Promise<{
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
