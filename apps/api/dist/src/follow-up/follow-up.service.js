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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FollowUpService = class FollowUpService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll(status, clinicianId) {
        const where = {};
        if (status)
            where.status = status;
        if (clinicianId)
            where.clinicianId = clinicianId;
        return this.prisma.followUp.findMany({
            where,
            orderBy: { scheduledDate: 'asc' },
            include: {
                participant: {
                    select: { id: true, firstName: true, lastName: true, nationalId: true, phoneNumber: true, gender: true },
                },
                clinician: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
    }
    async getOne(id) {
        const followUp = await this.prisma.followUp.findUnique({
            where: { id },
            include: {
                participant: true,
                clinician: { select: { firstName: true, lastName: true, role: true } },
            },
        });
        if (!followUp)
            throw new common_1.NotFoundException('Follow-up not found');
        return followUp;
    }
    async create(data) {
        return this.prisma.followUp.create({
            data: {
                participantId: data.participantId,
                clinicianId: data.clinicianId,
                scheduledDate: new Date(data.scheduledDate),
                notes: data.notes,
                status: 'SCHEDULED',
            },
            include: {
                participant: { select: { firstName: true, lastName: true } },
                clinician: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async updateStatus(id, status, notes) {
        const followUp = await this.prisma.followUp.findUnique({ where: { id } });
        if (!followUp)
            throw new common_1.NotFoundException('Follow-up not found');
        return this.prisma.followUp.update({
            where: { id },
            data: {
                status,
                notes: notes || followUp.notes,
                updatedAt: new Date(),
            },
        });
    }
    async getUpcoming(days = 7) {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);
        return this.prisma.followUp.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledDate: { gte: now, lte: future },
            },
            orderBy: { scheduledDate: 'asc' },
            include: {
                participant: { select: { firstName: true, lastName: true, phoneNumber: true } },
                clinician: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async getMissed() {
        const now = new Date();
        return this.prisma.followUp.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledDate: { lt: now },
            },
            orderBy: { scheduledDate: 'desc' },
            include: {
                participant: { select: { firstName: true, lastName: true, nationalId: true, phoneNumber: true } },
                clinician: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async getDashboardStats() {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const [scheduled, completed, missed, cancelled, upcoming] = await Promise.all([
            this.prisma.followUp.count({ where: { status: 'SCHEDULED' } }),
            this.prisma.followUp.count({ where: { status: 'COMPLETED' } }),
            this.prisma.followUp.count({ where: { status: 'SCHEDULED', scheduledDate: { lt: now } } }),
            this.prisma.followUp.count({ where: { status: 'CANCELLED' } }),
            this.prisma.followUp.count({ where: { status: 'SCHEDULED', scheduledDate: { gte: now, lte: nextWeek } } }),
        ]);
        return { scheduled, completed, missed, cancelled, upcoming };
    }
};
exports.FollowUpService = FollowUpService;
exports.FollowUpService = FollowUpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FollowUpService);
//# sourceMappingURL=follow-up.service.js.map