import { Module } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { FollowUpController } from './follow-up.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FollowUpService],
  controllers: [FollowUpController],
  exports: [FollowUpService],
})
export class FollowUpModule {}
