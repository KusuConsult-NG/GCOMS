import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ClinicalEncountersService } from './clinical-encounters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clinical-encounters')
export class ClinicalEncountersController {
  constructor(private readonly encountersService: ClinicalEncountersService) {}

  @Post()
  createEncounter(@Body() data: any, @Request() req: any) {
    return this.encountersService.createEncounter(data, req.user.id);
  }

  @Get('participant/:id')
  getEncounters(@Param('id') id: string) {
    return this.encountersService.getEncounters(id);
  }

  @Patch(':id')
  editEncounter(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    if (req.user.role !== 'CLINICIAN') {
      throw new UnauthorizedException('Only clinicians can edit encounters');
    }
    return this.encountersService.editEncounter(id, data.notes, req.user.id);
  }

  @Post('assignments')
  assignPatient(@Body() data: any, @Request() req: any) {
    if (req.user.role !== 'CLINICIAN' && req.user.role !== 'EXECUTIVE' && req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Not authorized to assign patients');
    }
    return this.encountersService.assignPatient(data, req.user.id);
  }

  @Get('assignments')
  getAssignments(@Request() req: any) {
    return this.encountersService.getAssignments(req.user.role === 'CLINICIAN' ? req.user.id : undefined);
  }
}
