import { VitalsService } from './vitals.service';
export declare class VitalsController {
    private readonly vitalsService;
    constructor(vitalsService: VitalsService);
    create(body: {
        participantId: string;
        bpSystolic?: number;
        bpDiastolic?: number;
        pulseRate?: number;
        temperature?: number;
        weightKg?: number;
        heightCm?: number;
        oxygenSat?: number;
    }): Promise<{
        id: string;
        participantId: string;
        bpSystolic: number | null;
        bpDiastolic: number | null;
        pulseRate: number | null;
        temperature: number | null;
        weightKg: number | null;
        heightCm: number | null;
        bmi: number | null;
        oxygenSat: number | null;
        recordedAt: Date;
    }>;
    getByParticipant(participantId: string): Promise<{
        id: string;
        participantId: string;
        bpSystolic: number | null;
        bpDiastolic: number | null;
        pulseRate: number | null;
        temperature: number | null;
        weightKg: number | null;
        heightCm: number | null;
        bmi: number | null;
        oxygenSat: number | null;
        recordedAt: Date;
    }[]>;
}
