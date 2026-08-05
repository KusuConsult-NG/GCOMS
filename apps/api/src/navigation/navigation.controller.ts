import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get('participant/:id')
  @Roles(...PHI_READ_ROLES)
  @UseGuards(ParticipantAccessGuard)
  async getTimeline(@Param('id') id: string) {
    return this.navigationService.getNavigationTimeline(id);
  }

  @Post('participant/:id/events')
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  @UseGuards(ParticipantAccessGuard)
  async addEvent(
    @Param('id') participantId: string,
    @Body() body: { eventType: string; notes?: string },
  ) {
    return this.navigationService.addNavigationEvent(
      participantId,
      body.eventType,
      body.notes,
    );
  }
}
