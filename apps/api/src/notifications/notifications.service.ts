import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(to: string, subject: string, body: string) {
    // Mocked email sending
    this.logger.log(`\n============================\n[MOCK EMAIL] \nTO: ${to}\nSUBJECT: ${subject}\nBODY: ${body}\n============================`);
  }

  async sendSms(to: string, message: string) {
    // Mocked SMS sending
    this.logger.log(`\n============================\n[MOCK SMS] \nTO: ${to}\nMESSAGE: ${message}\n============================`);
  }
}

