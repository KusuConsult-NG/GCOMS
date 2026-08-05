import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';
import { PhiAccessService } from '../phi/phi-access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly phi: PhiAccessService,
  ) {}

  @Get()
  @Roles(...PHI_READ_ROLES)
  async getAll(@Request() req: any) {
    return this.referralsService.getAll(this.phi.participantScope(req.user));
  }

  @Get(':id')
  @Roles(...PHI_READ_ROLES)
  async getOne(@Param('id') id: string, @Request() req: any) {
    return this.referralsService.getOne(
      id,
      this.phi.participantScope(req.user),
    );
  }

  @Post()
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  @UseGuards(ParticipantAccessGuard)
  async create(
    @Body() body: { participantId: string; referredTo: string; reason: string },
    @Request() req: any,
  ) {
    return this.referralsService.create({ ...body, referredById: req.user.id });
  }

  @Put(':id/status')
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req: any,
  ) {
    return this.referralsService.updateStatus(id, body.status, req.user);
  }
}
