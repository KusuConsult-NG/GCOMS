import { Module } from '@nestjs/common';
import { GrantsService } from './grants.service';
import { GrantsController } from './grants.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GrantsService],
  controllers: [GrantsController]
})
export class GrantsModule {}
