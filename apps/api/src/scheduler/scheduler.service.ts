import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class BackgroundSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BackgroundSchedulerService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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

          // Through NotificationsService rather than writing the row here.
          //
          // This used to create the NotificationItem directly with status
          // 'SENT' — on the SMS channel, for which this deployment has no
          // gateway at all. Nothing was sent, nothing was attempted, and the
          // record said the patient had been contacted. On a follow-up trail
          // that is the difference between "we chased her" and "we did not",
          // and it is the sort of claim the record exists to settle.
          //
          // sendSms records PENDING and says so in the log, which is what a
          // queued message with no transport actually is. When a gateway is
          // configured, the same call starts delivering with no change here.
          if (fu.participant.phoneNumber) {
            await this.notifications.sendSms(
              fu.participant.phoneNumber,
              `Hello ${fu.participant.firstName}, you missed your scheduled ` +
                'follow-up. Please contact GCOMS clinic.',
            );
          }
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
