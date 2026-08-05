import { ParticipantsService } from './participants.service';
export declare class ParticipantsController {
    private readonly participantsService;
    constructor(participantsService: ParticipantsService);
    create(createParticipantDto: any, req: any): Promise<{
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
    }>;
    findAll(req: any, search?: string): Promise<{
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
    }[]>;
    findOne(id: string, req: any): Promise<{
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
    } | null>;
}
