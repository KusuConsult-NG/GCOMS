import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [CommunitiesService, PrismaService],
  controllers: [CommunitiesController],
})
export class CommunitiesModule {}
