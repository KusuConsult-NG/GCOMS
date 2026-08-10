import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class BackgroundSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BackgroundSchedulerService.name);
  private timer?: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log('Background scheduler started');
    // Run once at boot, then on an interval.
    void this.runSchedulerChecks();

    this.timer = setInterval(() => {
      void this.runSchedulerChecks();
    }, CHECK_INTERVAL_MS);

    // The interval previously had no handle, no clearInterval and no unref, so
    // it kept the event loop alive on its own: shutdown hooks could not stop it,
    // and it went on querying a database that was being torn down.
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async runSchedulerChecks() {
    try {
      const now = new Date();

      // 1. Detect Missed Follow-ups
      const missedFollowUps = await this.prisma.followUp.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { lt: now },
        },
        include: { participant: true },
      });

      if (missedFollowUps.length > 0) {
        this.logger.warn(
          `Scheduler detected ${missedFollowUps.length} missed follow-up(s). Marking as MISSED.`,
        );
        for (const fu of missedFollowUps) {
          await this.prisma.followUp.update({
            where: { id: fu.id },
            data: { status: 'MISSED' },
          });

          // Log notification queue item
          await this.prisma.notificationItem.create({
            data: {
              recipient: fu.participant.phoneNumber || fu.participant.firstName,
              channel: 'SMS',
              subject: 'Missed Follow-up Alert',
              body: `Hello ${fu.participant.firstName}, you missed your scheduled follow-up. Please contact GCOMS clinic.`,
              status: 'SENT',
            },
          });
        }
      }

      // 2. Detect Missed Appointments
      const missedAppointments = await this.prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lt: now },
        },
        include: { participant: true },
      });

      if (missedAppointments.length > 0) {
        this.logger.warn(
          `Scheduler detected ${missedAppointments.length} missed appointment(s). Marking as MISSED.`,
        );
        for (const appt of missedAppointments) {
          await this.prisma.appointment.update({
            where: { id: appt.id },
            data: { status: 'MISSED' },
          });
        }
      }
    } catch (err) {
      this.logger.error(
        'Error running scheduler checks',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
