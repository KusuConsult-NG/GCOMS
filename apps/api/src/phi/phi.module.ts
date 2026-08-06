import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PhiAccessService } from './phi-access.service';
import { ParticipantAccessGuard } from './participant-access.guard';

/**
 * Global on purpose: patient-data access is a cross-cutting policy consumed by
 * most clinical modules, and having one shared answer to "may this user see
 * this record?" matters more here than explicit per-module wiring.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [PhiAccessService, ParticipantAccessGuard],
  exports: [PhiAccessService, ParticipantAccessGuard],
})
export class PhiModule {}
