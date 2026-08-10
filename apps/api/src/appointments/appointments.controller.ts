import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';
import { PhiAccessService } from '../phi/phi-access.service';
import { CLINICAL_WRITE_ROLES } from '../auth/roles.constants';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly apptService: AppointmentsService,
    private readonly phi: PhiAccessService,
  ) {}

  @Get()
  @Roles(...PHI_READ_ROLES)
  async getAll(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ) {
    return this.apptService.findAll(
      status,
      this.phi.participantScope(req.user),
    );
  }

  @Post()
  @Roles(...CLINICAL_WRITE_ROLES)
  @UseGuards(ParticipantAccessGuard)
  async create(
    @Body()
    body: {
      participantId: string;
      clinicianId?: string;
      scheduledAt: string;
      type?: string;
      notes?: string;
    },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.apptService.create({
      ...body,
      clinicianId: body.clinicianId || req.user.id,
    });
  }

  @Patch(':id/status')
  @Roles(...CLINICAL_WRITE_ROLES)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateAppointmentStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.apptService.updateStatus(id, body.status, body.notes, req.user);
  }
}
