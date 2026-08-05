"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BackgroundSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BackgroundSchedulerService = BackgroundSchedulerService_1 = class BackgroundSchedulerService {
    prisma;
    logger = new common_1.Logger(BackgroundSchedulerService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        this.logger.log('⏰ GCOMS Background Scheduler Engine initialized');
        this.runSchedulerChecks();
        setInterval(() => this.runSchedulerChecks(), 5 * 60 * 1000);
    }
    async runSchedulerChecks() {
        try {
            const now = new Date();
            const missedFollowUps = await this.prisma.followUp.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledDate: { lt: now },
                },
                include: { participant: true },
            });
            if (missedFollowUps.length > 0) {
                this.logger.warn(`⚠️ Scheduler detected ${missedFollowUps.length} missed follow-up(s). Marking as MISSED.`);
                for (const fu of missedFollowUps) {
                    await this.prisma.followUp.update({
                        where: { id: fu.id },
                        data: { status: 'MISSED' },
                    });
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
            const missedAppointments = await this.prisma.appointment.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: { lt: now },
                },
                include: { participant: true },
            });
            if (missedAppointments.length > 0) {
                this.logger.warn(`⚠️ Scheduler detected ${missedAppointments.length} missed appointment(s). Marking as MISSED.`);
                for (const appt of missedAppointments) {
                    await this.prisma.appointment.update({
                        where: { id: appt.id },
                        data: { status: 'MISSED' },
                    });
                }
            }
        }
        catch (err) {
            this.logger.error('Error running scheduler checks', err.stack);
        }
    }
};
exports.BackgroundSchedulerService = BackgroundSchedulerService;
exports.BackgroundSchedulerService = BackgroundSchedulerService = BackgroundSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BackgroundSchedulerService);
//# sourceMappingURL=scheduler.service.js.map