import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles(
    'EXECUTIVE',
    'SYSTEM_ADMIN',
    'BOARD',
    'PROGRAMME_MANAGER',
    'DATA_OFFICER',
  )
  async getSummary() {
    return this.reportsService.getExecutiveSummary();
  }

  /** The identified register. Audited — see ReportsService.exportReportData. */
  @Get('export')
  @Roles('EXECUTIVE', 'SYSTEM_ADMIN', 'DATA_OFFICER')
  async exportData(@Request() req: AuthenticatedRequest) {
    return this.reportsService.exportReportData(req.user.id);
  }
}
