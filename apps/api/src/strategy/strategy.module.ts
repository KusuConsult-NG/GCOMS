import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { StrategyController } from './strategy.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [StrategyController],
  providers: [StrategyService, PrismaService],
})
export class StrategyModule {}
