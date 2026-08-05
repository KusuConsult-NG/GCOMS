import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  async getAll() {
    return this.referralsService.getAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.referralsService.getOne(id);
  }

  @Post()
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async create(@Body() body: { participantId: string; referredTo: string; reason: string }, @Request() req: any) {
    return this.referralsService.create({ ...body, referredById: req.user.id });
  }

  @Put(':id/status')
  @Roles('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.referralsService.updateStatus(id, body.status);
  }
}
