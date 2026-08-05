import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OutreachService } from './outreach.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Get()
  async getAllOutreaches() {
    return this.outreachService.getAllOutreaches();
  }

  @Get(':id')
  async getOutreach(@Param('id') id: string) {
    return this.outreachService.getOutreach(id);
  }

  // Strictly enforce: Only Admin / System Admin / Executive can schedule an outreach campaign
  @Post()
  @Roles('ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE')
  async createOutreach(@Body() body: { title: string; locationId?: string; date: string; description?: string }) {
    return this.outreachService.createOutreach(body);
  }

  @Post(':id/tasks')
  @Roles('ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE')
  async assignVolunteerTask(
    @Param('id') outreachId: string,
    @Body() body: { volunteerId: string; title: string }
  ) {
    return this.outreachService.assignVolunteerTask(outreachId, body.volunteerId, body.title);
  }

  @Post('tasks/:taskId/hours')
  @Roles('VOLUNTEER', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async logVolunteerHours(
    @Param('taskId') taskId: string,
    @Body() body: { hours: number }
  ) {
    return this.outreachService.logVolunteerHours(taskId, body.hours);
  }
}
