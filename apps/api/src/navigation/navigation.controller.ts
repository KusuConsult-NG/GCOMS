import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get('participant/:id')
  async getTimeline(@Param('id') id: string) {
    return this.navigationService.getNavigationTimeline(id);
  }

  @Post('participant/:id/events')
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async addEvent(
    @Param('id') participantId: string,
    @Body() body: { eventType: string; notes?: string }
  ) {
    return this.navigationService.addNavigationEvent(participantId, body.eventType, body.notes);
  }
}
