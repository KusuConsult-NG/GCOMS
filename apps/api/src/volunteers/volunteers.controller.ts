import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Get()
  async getVolunteers() {
    return this.volunteersService.getVolunteers();
  }

  @Post('tasks')
  @Roles('EXECUTIVE', 'FIELD_OFFICER', 'ADMIN')
  async assignTask(@Body() body: { outreachId: string; volunteerId: string; title: string }) {
    return this.volunteersService.assignTask(body);
  }

  @Put('tasks/:taskId/hours')
  async logHours(@Param('taskId') taskId: string, @Body() body: { hours: number }) {
    return this.volunteersService.logHours(taskId, body.hours);
  }
}
