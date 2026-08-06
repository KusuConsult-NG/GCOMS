import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ListAuditLogQueryDto } from './dto/list-audit-log.dto';

@Injectable()
export class SystemAdminService {
  constructor(private prisma: PrismaService) {}

  async setConfig(key: string, value: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getConfigs() {
    return this.prisma.systemConfig.findMany();
  }

  /**
   * The audit trail, which had no read endpoint — so the admin screen showed
   * fabricated entries while the real PHI break-glass and role-change records
   * accumulated unseen. An audit log nobody can read is evidence after an
   * incident, not a control.
   */
  async listAuditLogs(query: ListAuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(query.limit ?? 100, 500),
      skip: query.offset ?? 0,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
