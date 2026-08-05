import { PrismaService } from '../prisma/prisma.service';
export declare class MedicalHistoryService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        participantId: string;
        conditionName: string;
        diagnosisDate?: string;
        familyHistory?: string;
        lifestyleNotes?: string;
        allergies?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        participantId: string;
        conditionName: string;
        diagnosisDate: Date | null;
        familyHistory: string | null;
        lifestyleNotes: string | null;
        allergies: string | null;
    }>;
    findByParticipant(participantId: string): Promise<{
        id: string;
        createdAt: Date;
        participantId: string;
        conditionName: string;
        diagnosisDate: Date | null;
        familyHistory: string | null;
        lifestyleNotes: string | null;
        allergies: string | null;
    }[]>;
}
