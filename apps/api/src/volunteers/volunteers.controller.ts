import { LogVolunteerHoursDto } from './dto/log-hours.dto';
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
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
  async assignTask(
    @Body() body: { outreachId: string; volunteerId: string; title: string },
  ) {
    return this.volunteersService.assignTask(body);
  }

  // Carried no @Roles and no DTO, so any authenticated caller could log any
  // number of hours against any task — including a negative one.
  @Put('tasks/:taskId/hours')
  @Roles('EXECUTIVE', 'FIELD_OFFICER', 'ADMIN', 'HR')
  async logHours(
    @Param('taskId') taskId: string,
    @Body() dto: LogVolunteerHoursDto,
  ) {
    return this.volunteersService.logHours(taskId, dto.hours);
  }
}
