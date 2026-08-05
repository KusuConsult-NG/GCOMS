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
        nationalId: string;
        dateOfBirth: Date;
        gender: string;
        phoneNumber: string | null;
        address: string | null;
        consentGiven: boolean;
        registeredById: string;
    }>;
    findAll(search?: string): Promise<{
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
    }[]>;
    findOne(id: string): Promise<{
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
    } | null>;
}
