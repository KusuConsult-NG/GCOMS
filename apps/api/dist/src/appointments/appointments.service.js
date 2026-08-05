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
const phi_access_service_1 = require("../phi/phi-access.service");
let AppointmentsService = class AppointmentsService {
    prisma;
    phi;
    constructor(prisma, phi) {
        this.prisma = prisma;
        this.phi = phi;
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
                participant: {
                    select: { firstName: true, lastName: true, phoneNumber: true },
                },
                clinician: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async findAll(status, scope) {
        const where = {};
        if (status)
            where.status = status;
        if (scope)
            where.participant = scope;
        return this.prisma.appointment.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
                participant: {
                    select: {
                        firstName: true,
                        lastName: true,
                        nationalId: true,
                        phoneNumber: true,
                    },
                },
                clinician: { select: { firstName: true, lastName: true, role: true } },
            },
        });
    }
    async updateStatus(id, status, notes, actor) {
        const appt = await this.prisma.appointment.findUnique({ where: { id } });
        if (!appt)
            throw new common_1.NotFoundException('Appointment not found');
        await this.phi.assertParticipantAccess(actor, appt.participantId, 'PATCH /appointments/:id/status');
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        phi_access_service_1.PhiAccessService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map