import { Module } from '@nestjs/common';
import { ScreeningsService } from './screenings.service';
import { ScreeningsController } from './screenings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ScreeningsService],
  controllers: [ScreeningsController]
})
export class ScreeningsModule {}
