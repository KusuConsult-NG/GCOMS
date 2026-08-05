import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly apptService: AppointmentsService) {}

  @Get()
  async getAll(@Query('status') status?: string, @Request() req?: any) {
    const clinicianId = req.user.role === 'CLINICIAN' ? req.user.id : undefined;
    return this.apptService.findAll(status, clinicianId);
  }

  @Post()
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async create(
    @Body() body: { participantId: string; clinicianId?: string; scheduledAt: string; type?: string; notes?: string },
    @Request() req: any
  ) {
    return this.apptService.create({
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
    return this.apptService.updateStatus(id, body.status, body.notes);
  }
}
