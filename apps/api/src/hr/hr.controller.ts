import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HR_READ_ROLES, HR_WRITE_ROLES } from '../auth/roles.constants';
import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  ListLeaveQueryDto,
  CreateAppraisalDto,
  UpdateAppraisalDto,
  CreateOnboardingDto,
  UpdateOnboardingDto,
} from './dto/hr-records.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // Was an inline role check.
  @Post()
  @Roles(...HR_WRITE_ROLES)
  createStaffRecord(@Body() data: any, @Request() req: any) {
    return this.hrService.createStaffRecord(data, req.user.id);
  }

  @Post('staff')
  createStaffRecordAlias(@Body() data: any, @Request() req: any) {
    return this.createStaffRecord(data, req);
  }

  @Get()
  @Roles(...HR_READ_ROLES)
  getStaffRecords(@Request() req: any) {
    return this.hrService.getStaffRecords();
  }

  @Get('staff')
  getStaffRecordsAlias(@Request() req: any) {
    return this.getStaffRecords(req);
  }

  @Get('leave')
  @Roles(...HR_READ_ROLES)
  listLeave(@Query() query: ListLeaveQueryDto) {
    return this.hrService.listLeave(query);
  }

  @Post('leave')
  @Roles(...HR_WRITE_ROLES)
  createLeave(@Body() dto: CreateLeaveRequestDto) {
    return this.hrService.createLeave(dto);
  }

  @Patch('leave/:id')
  @Roles(...HR_WRITE_ROLES)
  updateLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    return this.hrService.updateLeave(id, dto);
  }

  @Delete('leave/:id')
  @Roles(...HR_WRITE_ROLES)
  deleteLeave(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrService.deleteLeave(id);
  }

  @Get('appraisals')
  @Roles(...HR_READ_ROLES)
  listAppraisals(@Query('employeeId') employeeId?: string) {
    return this.hrService.listAppraisals(employeeId);
  }

  @Post('appraisals')
  @Roles(...HR_WRITE_ROLES)
  createAppraisal(@Body() dto: CreateAppraisalDto, @Request() req: any) {
    return this.hrService.createAppraisal(dto, req.user.id);
  }

  @Patch('appraisals/:id')
  @Roles(...HR_WRITE_ROLES)
  updateAppraisal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppraisalDto,
  ) {
    return this.hrService.updateAppraisal(id, dto);
  }

  @Get('onboarding')
  @Roles(...HR_READ_ROLES)
  listOnboarding() {
    return this.hrService.listOnboarding();
  }

  @Post('onboarding')
  @Roles(...HR_WRITE_ROLES)
  createOnboarding(@Body() dto: CreateOnboardingDto) {
    return this.hrService.createOnboarding(dto);
  }

  @Patch('onboarding/:id')
  @Roles(...HR_WRITE_ROLES)
  updateOnboarding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOnboardingDto,
  ) {
    return this.hrService.updateOnboarding(id, dto);
  }
}
