import { Module } from '@nestjs/common';
import { BackgroundSchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [BackgroundSchedulerService],
  exports: [BackgroundSchedulerService],
})
export class SchedulerModule {}
