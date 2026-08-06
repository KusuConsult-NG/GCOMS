import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ReferralsService, PrismaService],
  controllers: [ReferralsController],
})
export class ReferralsModule {}
