import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinanceService } from './finance.service';
import { LedgerService } from './ledger.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationsModule, PrismaModule],
  providers: [FinanceService, LedgerService],
  controllers: [FinanceController],
})
export class FinanceModule {}
