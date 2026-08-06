import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStrategicGoalDto,
  UpdateStrategicGoalDto,
} from './dto/strategy.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class StrategyService {
  constructor(private prisma: PrismaService) {}

  async createGoal(data: CreateStrategicGoalDto) {
    return this.prisma.strategicGoal.create({
      data: {
        title: data.title,
        targetMetric: data.targetMetric,
        deadline: new Date(data.deadline),
        status: 'ON_TRACK',
      },
    });
  }

  async getGoals() {
    return this.prisma.strategicGoal.findMany({
      ...paginate(),
      orderBy: { deadline: 'asc' },
    });
  }

  async updateGoal(id: string, data: UpdateStrategicGoalDto) {
    const goal = await this.prisma.strategicGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Strategic Goal not found');

    let status = 'ON_TRACK';
    if (data.currentMetric >= goal.targetMetric) {
      status = 'COMPLETED';
    } else if (new Date() > goal.deadline) {
      status = 'AT_RISK';
    }

    return this.prisma.strategicGoal.update({
      where: { id },
      data: {
        currentMetric: data.currentMetric,
        status,
      },
    });
  }
}
