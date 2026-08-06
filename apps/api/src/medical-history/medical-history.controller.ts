import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MedicalHistoryService } from './medical-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';
import { CLINICAL_WRITE_ROLES } from '../auth/roles.constants';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-history')
export class MedicalHistoryController {
  constructor(private readonly historyService: MedicalHistoryService) {}

  @Post()
  @Roles(...CLINICAL_WRITE_ROLES)
  @UseGuards(ParticipantAccessGuard)
  async create(
    @Body()
    body: {
      participantId: string;
      conditionName: string;
      diagnosisDate?: string;
      familyHistory?: string;
      lifestyleNotes?: string;
      allergies?: string;
    },
  ) {
    return this.historyService.create(body);
  }

  @Get('participant/:participantId')
  @Roles(...PHI_READ_ROLES)
  @UseGuards(ParticipantAccessGuard)
  async getByParticipant(@Param('participantId') participantId: string) {
    return this.historyService.findByParticipant(participantId);
  }
}
