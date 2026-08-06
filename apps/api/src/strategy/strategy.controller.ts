import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateStrategicGoalDto,
  UpdateStrategicGoalDto,
} from './dto/strategy.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Post('goals')
  @Roles('EXECUTIVE', 'BOARD')
  createGoal(@Body() data: CreateStrategicGoalDto) {
    return this.strategyService.createGoal(data);
  }

  @Get('goals')
  @Roles('EXECUTIVE', 'BOARD', 'SYSTEM_ADMIN')
  getGoals() {
    return this.strategyService.getGoals();
  }

  @Patch('goals/:id')
  @Roles('EXECUTIVE', 'BOARD')
  updateGoal(@Param('id') id: string, @Body() data: UpdateStrategicGoalDto) {
    return this.strategyService.updateGoal(id, data);
  }
}
