import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';

@Module({
  imports: [PrismaModule],
  providers: [OperationsService],
  controllers: [OperationsController],
})
export class OperationsModule {}
