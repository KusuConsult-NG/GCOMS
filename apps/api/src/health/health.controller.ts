import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unauthenticated on purpose: load balancers and orchestrators cannot present a
 * token. It reports only liveness and database reachability — no counts, no
 * configuration, nothing that describes the data.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: is the process up? */
  @Get()
  @HttpCode(HttpStatus.OK)
  liveness() {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  /** Readiness: can it actually serve traffic? */
  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      // 503, not a 200 with a sad payload — orchestrators route on the status
      // code, and a 200 here would keep sending traffic to a broken instance.
      throw new ServiceUnavailableException({
        status: 'degraded',
        database: 'down',
      });
    }
  }
}
