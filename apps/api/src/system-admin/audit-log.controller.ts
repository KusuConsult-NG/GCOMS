import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemAdminService } from './system-admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ListAuditLogQueryDto } from './dto/list-audit-log.dto';

/**
 * Separate controller because SystemAdminController is mounted at
 * 'system-admin/config'.
 *
 * Deliberately narrow: the audit trail records who reached outside their patient
 * caseload and who changed whose role, so reading it is itself a privileged act.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system-admin/audit-logs')
export class AuditLogController {
  constructor(private readonly systemAdminService: SystemAdminService) {}

  @Get()
  @Roles('EXECUTIVE', 'SYSTEM_ADMIN')
  list(@Query() query: ListAuditLogQueryDto) {
    return this.systemAdminService.listAuditLogs(query);
  }
}
