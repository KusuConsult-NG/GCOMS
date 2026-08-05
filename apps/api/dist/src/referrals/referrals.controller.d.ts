import { ReferralsService } from './referrals.service';
export declare class ReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
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
}
