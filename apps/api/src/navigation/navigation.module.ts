import { Module } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [NavigationService, PrismaService],
  controllers: [NavigationController]
})
export class NavigationModule {}
