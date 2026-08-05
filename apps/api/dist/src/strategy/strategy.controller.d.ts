import { StrategyService } from './strategy.service';
import { CreateStrategicGoalDto, UpdateStrategicGoalDto } from './dto/strategy.dto';
export declare class StrategyController {
    private readonly strategyService;
    constructor(strategyService: StrategyService);
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
