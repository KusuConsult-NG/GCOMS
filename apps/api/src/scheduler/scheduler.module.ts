import { Module } from '@nestjs/common';
import { BackgroundSchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BackgroundSchedulerService],
  exports: [BackgroundSchedulerService],
})
export class SchedulerModule {}
