import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @Roles('EXECUTIVE', 'SYSTEM_ADMIN', 'BOARD')
  getSummary() {
    return this.analyticsService.getSummary();
  }

  /**
   * Programme reach per Local Government Area. Aggregate counts only — no
   * patient is identifiable in the response — but it is still a map of where
   * the programme's patients are, so it carries the same roles as the summary
   * rather than being open to every authenticated account.
   */
  @Get('lga')
  @Roles('EXECUTIVE', 'SYSTEM_ADMIN', 'BOARD')
  getLgaCoverage() {
    return this.analyticsService.getLgaCoverage();
  }
}
