import { Module } from '@nestjs/common';
import { ClinicalEncountersService } from './clinical-encounters.service';
import { ClinicalEncountersController } from './clinical-encounters.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ClinicalEncountersService],
  controllers: [ClinicalEncountersController],
})
export class ClinicalEncountersModule {}
