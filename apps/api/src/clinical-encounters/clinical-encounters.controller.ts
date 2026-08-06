import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClinicalEncountersService } from './clinical-encounters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { ParticipantAccessGuard } from '../phi/participant-access.guard';
import { PhiAccessService } from '../phi/phi-access.service';
import {
  CreateInvestigationDto,
  UpdateInvestigationDto,
} from './dto/investigation.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical-encounters')
export class ClinicalEncountersController {
  constructor(
    private readonly encountersService: ClinicalEncountersService,
    private readonly phi: PhiAccessService,
  ) {}

  // Previously had no role check at all — any authenticated account could write
  // a clinical encounter.
  @Post()
  @Roles('CLINICIAN', 'EXECUTIVE', 'ADMIN')
  @UseGuards(ParticipantAccessGuard)
  createEncounter(@Body() data: any, @Request() req: any) {
    return this.encountersService.createEncounter(data, req.user.id);
  }

  @Get('participant/:id')
  @Roles(...PHI_READ_ROLES)
  @UseGuards(ParticipantAccessGuard)
  getEncounters(@Param('id') id: string) {
    return this.encountersService.getEncounters(id);
  }

  // Was an inline `req.user.role !== 'CLINICIAN'` check; RolesGuard additionally
  // admits EXECUTIVE and SYSTEM_ADMIN, which it does for every route.
  @Patch(':id')
  @Roles('CLINICIAN')
  editEncounter(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.encountersService.editEncounter(
      id,
      data.notes,
      req.user.id,
      req.user,
    );
  }

  @Post('assignments')
  @Roles('CLINICIAN', 'EXECUTIVE', 'ADMIN')
  @UseGuards(ParticipantAccessGuard)
  assignPatient(@Body() data: any, @Request() req: any) {
    return this.encountersService.assignPatient(data, req.user.id);
  }

  /**
   * A caseload listing: scoped roles see their own assignments, oversight roles
   * see all of them. Previously keyed off CLINICIAN specifically, so every other
   * role — including VOLUNTEER — received the full assignment list.
   */
  @Get('assignments')
  @Roles(...PHI_READ_ROLES)
  getAssignments(@Request() req: any) {
    const clinicianId = this.phi.isUnscoped(req.user.role)
      ? undefined
      : req.user.id;
    return this.encountersService.getAssignments(clinicianId);
  }

  /* Investigations — PHI, gated in the service by the owning participant. */

  @Get('investigations/:encounterId')
  @Roles(...PHI_READ_ROLES)
  listInvestigations(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Request() req: any,
  ) {
    return this.encountersService.listInvestigations(encounterId, req.user);
  }

  @Post('investigations')
  @Roles('CLINICIAN', 'EXECUTIVE', 'ADMIN')
  createInvestigation(
    @Body() dto: CreateInvestigationDto,
    @Request() req: any,
  ) {
    return this.encountersService.createInvestigation(dto, req.user);
  }

  @Patch('investigations/:id')
  @Roles('CLINICIAN', 'EXECUTIVE', 'ADMIN')
  updateInvestigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvestigationDto,
    @Request() req: any,
  ) {
    return this.encountersService.updateInvestigation(id, dto, req.user);
  }
}
