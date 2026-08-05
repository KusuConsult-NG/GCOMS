import { MedicalHistoryService } from './medical-history.service';
export declare class MedicalHistoryController {
    private readonly historyService;
    constructor(historyService: MedicalHistoryService);
    create(body: {
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
    getByParticipant(participantId: string): Promise<{
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
