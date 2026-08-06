import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  GOVERNANCE_ROLES,
  GRANT_READ_ROLES,
  GRANT_WRITE_ROLES,
  HR_READ_ROLES,
  INVENTORY_READ_ROLES,
  INVENTORY_WRITE_ROLES,
  PROCUREMENT_READ_ROLES,
  PROCUREMENT_WRITE_ROLES,
  PROJECT_READ_ROLES,
  PROJECT_WRITE_ROLES,
  RECRUITMENT_ROLES,
} from '../auth/roles.constants';
import * as dto from './dto/operations.dto';

/** The authenticated caller, as JwtStrategy puts it on the request. */
type Actor = { user: { id: string; role: string } };

/**
 * Operational records that previously lived only in browser state. Grouped in
 * one controller because they share nothing but that history; each route carries
 * the role set of the module it belongs to.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly ops: OperationsService) {}

  // Recruitment
  @Get('job-openings')
  @Roles(...HR_READ_ROLES)
  listJobs(@Query('status') status?: string) {
    return this.ops.listJobOpenings(status);
  }

  @Post('job-openings')
  @Roles(...RECRUITMENT_ROLES)
  createJob(@Body() d: dto.CreateJobOpeningDto) {
    return this.ops.createJobOpening(d);
  }

  @Patch('job-openings/:id')
  @Roles(...RECRUITMENT_ROLES)
  updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateJobOpeningDto,
  ) {
    return this.ops.updateJobOpening(id, d);
  }

  @Post('applicants')
  @Roles(...RECRUITMENT_ROLES)
  createApplicant(@Body() d: dto.CreateApplicantDto) {
    return this.ops.createApplicant(d);
  }

  @Patch('applicants/:id')
  @Roles(...RECRUITMENT_ROLES)
  updateApplicant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateApplicantDto,
  ) {
    return this.ops.updateApplicant(id, d);
  }

  // Training
  @Get('training')
  @Roles(...HR_READ_ROLES)
  listTraining() {
    return this.ops.listTraining();
  }

  @Post('training')
  @Roles(...RECRUITMENT_ROLES)
  createTraining(@Body() d: dto.CreateTrainingDto) {
    return this.ops.createTraining(d);
  }

  // Volunteers
  @Get('volunteers')
  @Roles(...HR_READ_ROLES)
  listVolunteers() {
    return this.ops.listVolunteers();
  }

  @Post('volunteers')
  @Roles(...RECRUITMENT_ROLES)
  createVolunteer(@Body() d: dto.CreateVolunteerProfileDto) {
    return this.ops.createVolunteerProfile(d);
  }

  // Governance
  @Get('board-members')
  @Roles(...GOVERNANCE_ROLES)
  listBoardMembers() {
    return this.ops.listBoardMembers();
  }

  @Post('board-members')
  @Roles(...GOVERNANCE_ROLES)
  createBoardMember(@Body() d: dto.CreateBoardMemberDto) {
    return this.ops.createBoardMember(d);
  }

  @Get('board-actions')
  @Roles(...GOVERNANCE_ROLES)
  listBoardActions(@Query('status') status?: string) {
    return this.ops.listBoardActions(status);
  }

  @Post('board-actions')
  @Roles(...GOVERNANCE_ROLES)
  createBoardAction(@Body() d: dto.CreateBoardActionDto) {
    return this.ops.createBoardAction(d);
  }

  @Patch('board-actions/:id')
  @Roles(...GOVERNANCE_ROLES)
  updateBoardAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateBoardActionDto,
  ) {
    return this.ops.updateBoardAction(id, d);
  }

  // Stock movements
  @Get('stock-movements')
  @Roles(...INVENTORY_READ_ROLES)
  listMovements(@Query('inventoryItemId') inventoryItemId?: string) {
    return this.ops.listMovements(inventoryItemId);
  }

  @Post('stock-movements')
  @Roles(...INVENTORY_WRITE_ROLES)
  createMovement(@Body() d: dto.CreateStockMovementDto) {
    return this.ops.createMovement(d);
  }

  // Project risks
  @Get('risks')
  @Roles(...PROJECT_READ_ROLES)
  listRisks(@Query('projectId') projectId?: string) {
    return this.ops.listRisks(projectId);
  }

  @Post('risks')
  @Roles(...PROJECT_WRITE_ROLES)
  createRisk(@Body() d: dto.CreateProjectRiskDto) {
    return this.ops.createRisk(d);
  }

  @Patch('risks/:id')
  @Roles(...PROJECT_WRITE_ROLES)
  updateRisk(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateProjectRiskDto,
  ) {
    return this.ops.updateRisk(id, d);
  }

  // Donors & grant reporting
  @Get('donors')
  @Roles(...GRANT_READ_ROLES)
  listDonors() {
    return this.ops.listDonors();
  }

  @Post('donors')
  @Roles(...GRANT_WRITE_ROLES)
  createDonor(@Body() d: dto.CreateDonorDto) {
    return this.ops.createDonor(d);
  }

  @Get('report-schedules')
  @Roles(...GRANT_READ_ROLES)
  listReports(@Query('grantId') grantId?: string) {
    return this.ops.listReportSchedules(grantId);
  }

  @Post('report-schedules')
  @Roles(...GRANT_WRITE_ROLES)
  createReport(@Body() d: dto.CreateReportScheduleDto) {
    return this.ops.createReportSchedule(d);
  }

  @Patch('report-schedules/:id')
  @Roles(...GRANT_WRITE_ROLES)
  updateReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateReportScheduleDto,
  ) {
    return this.ops.updateReportSchedule(id, d);
  }

  // Vendors & RFQs
  @Get('vendors')
  @Roles(...PROCUREMENT_READ_ROLES)
  listVendors(@Query('status') status?: string) {
    return this.ops.listVendors(status);
  }

  @Post('vendors')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  createVendor(@Body() d: dto.CreateVendorDto) {
    return this.ops.createVendor(d);
  }

  @Patch('vendors/:id')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  updateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateVendorDto,
  ) {
    return this.ops.updateVendor(id, d);
  }

  @Get('rfqs')
  @Roles(...PROCUREMENT_READ_ROLES)
  listRfqs(@Query('status') status?: string) {
    return this.ops.listRfqs(status);
  }

  @Post('rfqs')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  createRfq(@Body() d: dto.CreateRfqDto) {
    return this.ops.createRfq(d);
  }

  @Post('quotes')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  createQuote(@Body() d: dto.CreateQuoteDto) {
    return this.ops.createQuote(d);
  }

  @Patch('quotes/:id')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  updateQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateQuoteDto,
  ) {
    return this.ops.updateQuote(id, d);
  }

  // Annual procurement plan
  @Get('plan-items')
  @Roles(...PROCUREMENT_READ_ROLES)
  listPlanItems(
    @Query('fiscalYear') fiscalYear?: string,
    @Query('status') status?: string,
  ) {
    // Parsed here rather than trusted: a non-numeric year must not reach the
    // query as NaN and silently match nothing.
    const year = fiscalYear ? Number(fiscalYear) : undefined;
    return this.ops.listPlanItems(
      Number.isFinite(year) ? year : undefined,
      status,
    );
  }

  @Post('plan-items')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  createPlanItem(@Body() d: dto.CreatePlanItemDto, @Request() req: Actor) {
    return this.ops.createPlanItem(d, req.user.id);
  }

  @Patch('plan-items/:id')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  updatePlanItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdatePlanItemDto,
  ) {
    return this.ops.updatePlanItem(id, d);
  }

  // Goods received notes
  @Get('grns')
  @Roles(...PROCUREMENT_READ_ROLES)
  listGrns(@Query('procurementOrderId') procurementOrderId?: string) {
    return this.ops.listGrns(procurementOrderId);
  }

  @Post('grns')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  createGrn(@Body() d: dto.CreateGrnDto, @Request() req: Actor) {
    return this.ops.createGrn(d, req.user.id);
  }

  // Contracts
  @Get('contracts')
  @Roles(...PROCUREMENT_READ_ROLES)
  listContracts(@Query('status') status?: string) {
    return this.ops.listContracts(status);
  }

  @Post('contracts')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  createContract(@Body() d: dto.CreateContractDto, @Request() req: Actor) {
    return this.ops.createContract(d, req.user.id);
  }

  @Patch('contracts/:id')
  @Roles(...PROCUREMENT_WRITE_ROLES)
  updateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: dto.UpdateContractDto,
  ) {
    return this.ops.updateContract(id, d);
  }
}
