import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';
import { CLINICAL_WRITE_ROLES } from '../auth/roles.constants';
import { CreateVitalsDto } from './dto/create-vitals.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @Roles(...CLINICAL_WRITE_ROLES)
  @UseGuards(ParticipantAccessGuard)
  async create(@Body() body: CreateVitalsDto) {
    return this.vitalsService.create(body);
  }

  @Get('participant/:participantId')
  @Roles(...PHI_READ_ROLES)
  @UseGuards(ParticipantAccessGuard)
  async getByParticipant(@Param('participantId') participantId: string) {
    return this.vitalsService.findByParticipant(participantId);
  }
}
