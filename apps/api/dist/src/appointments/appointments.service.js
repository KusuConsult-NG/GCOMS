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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AppointmentsService = class AppointmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.appointment.create({
            data: {
                participantId: data.participantId,
                clinicianId: data.clinicianId,
                scheduledAt: new Date(data.scheduledAt),
                type: data.type || 'FOLLOW_UP',
                notes: data.notes,
                status: 'SCHEDULED',
            },
            include: {
                participant: { select: { firstName: true, lastName: true, phoneNumber: true } },
                clinician: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async findAll(status, clinicianId) {
        const where = {};
        if (status)
            where.status = status;
        if (clinicianId)
            where.clinicianId = clinicianId;
        return this.prisma.appointment.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
                participant: { select: { firstName: true, lastName: true, nationalId: true, phoneNumber: true } },
                clinician: { select: { firstName: true, lastName: true, role: true } },
            },
        });
    }
    async updateStatus(id, status, notes) {
        const appt = await this.prisma.appointment.findUnique({ where: { id } });
        if (!appt)
            throw new common_1.NotFoundException('Appointment not found');
        return this.prisma.appointment.update({
            where: { id },
            data: {
                status,
                notes: notes || appt.notes,
            },
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map