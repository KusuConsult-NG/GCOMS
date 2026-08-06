import { ScheduleMeetingDto } from './dto/schedule-meeting.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateGovernanceMeetingDto } from './dto/create-governance-meeting.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('governance/meetings')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post()
  @Roles('EXECUTIVE', 'BOARD')
  scheduleMeeting(
    @Body() data: CreateGovernanceMeetingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.governanceService.scheduleMeeting(data, req.user.id);
  }

  @Get()
  @Roles('EXECUTIVE', 'BOARD')
  getMeetings() {
    return this.governanceService.getMeetings();
  }
}
