import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScreeningsService } from './screenings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @Post()
  @Roles(
    'CLINICIAN',
    'FIELD_OFFICER',
    'COMMUNITY_HEALTH_WORKER',
    'EXECUTIVE',
    'ADMIN',
  )
  @UseGuards(ParticipantAccessGuard)
  createScreening(@Body() data: any, @Request() req: any) {
    return this.screeningsService.createScreening(data, req.user.id);
  }

  @Get('participant/:id')
  @Roles(...PHI_READ_ROLES)
  @UseGuards(ParticipantAccessGuard)
  getScreenings(@Param('id') id: string) {
    return this.screeningsService.getScreenings(id);
  }
}
