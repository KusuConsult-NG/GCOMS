import { Module } from '@nestjs/common';
import { ResearchService } from './research.service';
import { ResearchController } from './research.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ResearchService, PrismaService],
  controllers: [ResearchController],
})
export class ResearchModule {}
