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
import { FollowUpService } from './follow-up.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';
import { PhiAccessService } from '../phi/phi-access.service';
import { CLINICAL_WRITE_ROLES } from '../auth/roles.constants';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('follow-ups')
export class FollowUpController {
  constructor(
    private readonly followUpService: FollowUpService,
    private readonly phi: PhiAccessService,
  ) {}

  @Get()
  @Roles(...PHI_READ_ROLES)
  async getAll(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ) {
    return this.followUpService.getAll(
      status,
      this.phi.participantScope(req.user),
    );
  }

  @Get('dashboard-stats')
  @Roles(...PHI_READ_ROLES)
  async getDashboardStats(@Request() req: AuthenticatedRequest) {
    return this.followUpService.getDashboardStats(
      this.phi.participantScope(req.user),
    );
  }

  @Get('upcoming')
  @Roles(...PHI_READ_ROLES)
  async getUpcoming(
    @Request() req: AuthenticatedRequest,
    @Query('days') days?: string,
  ) {
    return this.followUpService.getUpcoming(
      days ? parseInt(days) : 7,
      this.phi.participantScope(req.user),
    );
  }

  @Get('missed')
  @Roles(...PHI_READ_ROLES)
  async getMissed(@Request() req: AuthenticatedRequest) {
    return this.followUpService.getMissed(this.phi.participantScope(req.user));
  }

  @Get(':id')
  @Roles(...PHI_READ_ROLES)
  async getOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.followUpService.getOne(id, this.phi.participantScope(req.user));
  }

  @Post()
  @Roles(...CLINICAL_WRITE_ROLES)
  @UseGuards(ParticipantAccessGuard)
  async create(
    @Body()
    body: {
      participantId: string;
      clinicianId: string;
      scheduledDate: string;
      notes?: string;
    },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.followUpService.create({
      ...body,
      clinicianId: body.clinicianId || req.user.id,
    });
  }

  @Patch(':id/status')
  @Roles(...CLINICAL_WRITE_ROLES)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.followUpService.updateStatus(
      id,
      body.status,
      body.notes,
      req.user,
    );
  }
}
