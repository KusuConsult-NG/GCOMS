export declare class NotificationsService {
    private readonly logger;
    sendEmail(to: string, subject: string, body: string): Promise<void>;
    sendSms(to: string, message: string): Promise<void>;
}
