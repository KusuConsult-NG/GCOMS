import { Module } from '@nestjs/common';
import { SystemAdminService } from './system-admin.service';
import { SystemAdminController } from './system-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SystemAdminService],
  controllers: [SystemAdminController]
})
export class SystemAdminModule {}
