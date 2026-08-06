import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Deliberately open to every authenticated role — this is the landing page for
 * finance, HR and procurement staff too. The PHI it used to leak (a recent
 * patient list, complete with national IDs) is filtered inside the service
 * rather than by denying the whole endpoint.
 */
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getStats(req.user);
  }
}
