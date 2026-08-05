import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Get()
  async getAll(@Query('status') status?: string, @Request() req?: any) {
    const isClinicianView = req.user.role === 'CLINICIAN';
    const clinicianId = isClinicianView ? req.user.id : undefined;
    return this.followUpService.getAll(status, clinicianId);
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.followUpService.getDashboardStats();
  }

  @Get('upcoming')
  async getUpcoming(@Query('days') days?: string) {
    return this.followUpService.getUpcoming(days ? parseInt(days) : 7);
  }

  @Get('missed')
  async getMissed() {
    return this.followUpService.getMissed();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.followUpService.getOne(id);
  }

  @Post()
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async create(
    @Body() body: { participantId: string; clinicianId: string; scheduledDate: string; notes?: string },
    @Request() req: any
  ) {
    return this.followUpService.create({
      ...body,
      clinicianId: body.clinicianId || req.user.id,
    });
  }

  @Patch(':id/status')
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string }
  ) {
    return this.followUpService.updateStatus(id, body.status, body.notes);
  }
}
