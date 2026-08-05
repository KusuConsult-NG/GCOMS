import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async create(
    @Body()
    body: {
      participantId: string;
      bpSystolic?: number;
      bpDiastolic?: number;
      pulseRate?: number;
      temperature?: number;
      weightKg?: number;
      heightCm?: number;
      oxygenSat?: number;
    }
  ) {
    return this.vitalsService.create(body);
  }

  @Get('participant/:participantId')
  async getByParticipant(@Param('participantId') participantId: string) {
    return this.vitalsService.findByParticipant(participantId);
  }
}
