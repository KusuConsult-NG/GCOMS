import { CreateScreeningDto } from './dto/create-screening.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
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
import { CLINICAL_WRITE_ROLES } from '../auth/roles.constants';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @Post()
  @Roles(...CLINICAL_WRITE_ROLES)
  @UseGuards(ParticipantAccessGuard)
  createScreening(
    @Body() data: CreateScreeningDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.screeningsService.createScreening(data, req.user.id);
  }

  @Get('participant/:id')
  @Roles(...PHI_READ_ROLES)
  @UseGuards(ParticipantAccessGuard)
  getScreenings(@Param('id') id: string) {
    return this.screeningsService.getScreenings(id);
  }
}
