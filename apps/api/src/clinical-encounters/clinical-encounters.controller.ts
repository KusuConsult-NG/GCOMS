import {
  AssignPatientDto,
  CreateEncounterDto,
  EditEncounterDto,
} from './dto/encounter.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
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
  CLINICAL_WRITE_ROLES,
  DIAGNOSING_ROLES,
  DIAGNOSING_WRITE_ROLES,
} from '../auth/roles.constants';
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
  @Roles(...CLINICAL_WRITE_ROLES)
  @UseGuards(ParticipantAccessGuard)
  createEncounter(
    @Body() data: CreateEncounterDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.encountersService.createEncounter(data, req.user);
  }

  @Get('participant/:id')
  @Roles(...PHI_READ_ROLES)
  @UseGuards(ParticipantAccessGuard)
  getEncounters(@Param('id') id: string) {
    return this.encountersService.getEncounters(id);
  }

  // Was an inline `req.user.role !== 'CLINICIAN'` check; RolesGuard additionally
  // admits EXECUTIVE and SYSTEM_ADMIN, which it does for every route.
  // Editing a clinical note is a diagnostic act, so nurses are excluded here
  // while remaining able to create the encounter above.
  @Patch(':id')
  @Roles(...DIAGNOSING_ROLES)
  editEncounter(
    @Param('id') id: string,
    @Body() data: EditEncounterDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.encountersService.editEncounter(
      id,
      data.notes,
      req.user.id,
      req.user,
    );
  }

  @Post('assignments')
  @Roles(...CLINICAL_WRITE_ROLES)
  @UseGuards(ParticipantAccessGuard)
  assignPatient(
    @Body() data: AssignPatientDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.encountersService.assignPatient(data, req.user.id);
  }

  /**
   * A caseload listing: scoped roles see their own assignments, oversight roles
   * see all of them. Previously keyed off CLINICIAN specifically, so every other
   * role — including VOLUNTEER — received the full assignment list.
   */
  @Get('assignments')
  @Roles(...PHI_READ_ROLES)
  getAssignments(@Request() req: AuthenticatedRequest) {
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
    @Request() req: AuthenticatedRequest,
  ) {
    return this.encountersService.listInvestigations(encounterId, req.user);
  }

  // Recommendations drawn from investigation results are diagnostic conclusions.
  @Post('investigations')
  @Roles(...DIAGNOSING_WRITE_ROLES)
  createInvestigation(
    @Body() dto: CreateInvestigationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.encountersService.createInvestigation(dto, req.user);
  }

  @Patch('investigations/:id')
  @Roles(...DIAGNOSING_WRITE_ROLES)
  updateInvestigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvestigationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.encountersService.updateInvestigation(id, dto, req.user);
  }
}
