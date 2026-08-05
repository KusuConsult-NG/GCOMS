import { Module } from '@nestjs/common';
import { OutreachService } from './outreach.service';
import { OutreachController } from './outreach.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [OutreachService, PrismaService],
  controllers: [OutreachController]
})
export class OutreachModule {}
