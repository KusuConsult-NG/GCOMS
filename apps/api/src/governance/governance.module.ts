import { Module } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { GovernanceController } from './governance.controller';
import { GovernanceResolutionsController } from './governance-resolutions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GovernanceService],
  controllers: [GovernanceController, GovernanceResolutionsController],
})
export class GovernanceModule {}
