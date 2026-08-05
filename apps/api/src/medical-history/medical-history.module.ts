import { Module } from '@nestjs/common';
import { MedicalHistoryService } from './medical-history.service';
import { MedicalHistoryController } from './medical-history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MedicalHistoryService],
  controllers: [MedicalHistoryController],
  exports: [MedicalHistoryService],
})
export class MedicalHistoryModule {}
