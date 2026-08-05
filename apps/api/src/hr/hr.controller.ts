import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post()
  createStaffRecord(@Body() data: any, @Request() req: any) {
    if (!['HR', 'EXECUTIVE', 'ADMIN', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException('Only HR, Executive, and Admin roles can manage staff');
    }
    return this.hrService.createStaffRecord(data, req.user.id);
  }

  @Post('staff')
  createStaffRecordAlias(@Body() data: any, @Request() req: any) {
    return this.createStaffRecord(data, req);
  }

  @Get()
  getStaffRecords(@Request() req: any) {
    if (!['HR', 'EXECUTIVE', 'ADMIN', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException('Only HR, Executive, and Admin roles can view staff records');
    }
    return this.hrService.getStaffRecords();
  }

  @Get('staff')
  getStaffRecordsAlias(@Request() req: any) {
    return this.getStaffRecords(req);
  }
}
