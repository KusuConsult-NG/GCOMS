import { PrismaService } from '../prisma/prisma.service';
import { CreateStrategicGoalDto, UpdateStrategicGoalDto } from './dto/strategy.dto';
export declare class StrategyService {
    private prisma;
    constructor(prisma: PrismaService);
    createGoal(data: CreateStrategicGoalDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        targetMetric: number;
        deadline: Date;
        currentMetric: number;
    }>;
    getGoals(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        targetMetric: number;
        deadline: Date;
        currentMetric: number;
    }[]>;
    updateGoal(id: string, data: UpdateStrategicGoalDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        targetMetric: number;
        deadline: Date;
        currentMetric: number;
    }>;
}
