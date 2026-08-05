import { PrismaService } from '../prisma/prisma.service';
export declare class VitalsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
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
    findByParticipant(participantId: string): Promise<{
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
