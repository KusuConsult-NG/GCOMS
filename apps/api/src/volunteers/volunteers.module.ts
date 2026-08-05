import { Module } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { VolunteersController } from './volunteers.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [VolunteersService, PrismaService],
  controllers: [VolunteersController]
})
export class VolunteersModule {}
