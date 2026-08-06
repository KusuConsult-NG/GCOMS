import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Notifications, as an outbox rather than a log line.
 *
 * This used to print "[MOCK EMAIL]" and return. Approval requests, referrals and
 * follow-up reminders therefore notified nobody, and the calling code could not
 * tell — every send "succeeded".
 *
 * Now every message is persisted to NotificationItem first, then delivery is
 * attempted. That ordering matters: a message recorded but not sent can be
 * retried and audited, whereas a message sent but not recorded is invisible.
 *
 * SMTP is optional by design. Without credentials there is no transport, and
 * messages are stored with status PENDING and logged — honest about not having
 * been delivered, unlike the previous mock. Set SMTP_HOST/SMTP_USER/SMTP_PASS
 * and the same messages go out for real, with no code change.
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private transport: nodemailer.Transporter | null = null;
  private from = 'noreply@gcoms.org';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from = this.config.get<string>('SMTP_FROM') || this.from;

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS). Notifications ' +
          'will be recorded with status PENDING and logged, not delivered.',
      );
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    this.transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    this.logger.log(`SMTP transport ready: ${host}:${port}`);
  }

  /** True when messages will actually leave the building. */
  get isConfigured(): boolean {
    return this.transport !== null;
  }

  async sendEmail(to: string, subject: string, body: string) {
    return this.dispatch('EMAIL', to, subject, body);
  }

  async sendSms(to: string, message: string) {
    // No SMS gateway is configured for this deployment. Recording it keeps the
    // intent queued and visible rather than silently dropped.
    return this.dispatch('SMS', to, 'SMS', message);
  }

  private async dispatch(
    channel: 'EMAIL' | 'SMS',
    recipient: string,
    subject: string,
    body: string,
  ) {
    const item = await this.prisma.notificationItem.create({
      data: { recipient, channel, subject, body, status: 'PENDING' },
    });

    if (channel !== 'EMAIL' || !this.transport) {
      this.logger.log(
        `[queued ${channel}] to=${recipient} subject="${subject}" (no transport configured)`,
      );
      return item;
    }

    try {
      await this.transport.sendMail({
        from: this.from,
        to: recipient,
        subject,
        text: body,
      });
      return this.prisma.notificationItem.update({
        where: { id: item.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      // A failed send must not fail the operation that triggered it — an
      // approval should still resolve when the mail server is down — but it has
      // to be visible rather than swallowed.
      this.logger.error(
        `Failed to deliver ${channel} to ${recipient}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.prisma.notificationItem.update({
        where: { id: item.id },
        data: { status: 'FAILED' },
      });
    }
  }

  /**
   * Notify everyone who can actually resolve approvals.
   *
   * Finance, procurement and facility requests each created an ApprovalRequest
   * inline and notified nobody — only the approvals module sent anything, and it
   * addressed a hardcoded executives@gcoms.org that no account owns. So no
   * approver was ever reachable by any path.
   */
  async notifyApprovers(title: string, description: string) {
    const approvers = await this.prisma.user.findMany({
      where: { role: { in: ['EXECUTIVE', 'BOARD'] }, isActive: true },
      select: { email: true },
    });
    for (const approver of approvers) {
      await this.sendEmail(
        approver.email,
        `Approval required: ${title}`,
        description,
      );
    }
    return approvers.length;
  }
}
