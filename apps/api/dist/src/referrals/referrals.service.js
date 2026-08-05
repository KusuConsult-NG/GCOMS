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
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const phi_access_service_1 = require("../phi/phi-access.service");
let ReferralsService = class ReferralsService {
    prisma;
    phi;
    constructor(prisma, phi) {
        this.prisma = prisma;
        this.phi = phi;
    }
    async getAll(scope) {
        return this.prisma.referral.findMany({
            where: scope ? { participant: scope } : {},
            include: { participant: true, referredBy: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getOne(id, scope) {
        const referral = await this.prisma.referral.findFirst({
            where: { id, ...(scope ? { participant: scope } : {}) },
            include: { participant: true, referredBy: true },
        });
        if (!referral)
            throw new common_1.NotFoundException('Referral record not found');
        return referral;
    }
    async create(data) {
        return this.prisma.referral.create({
            data: {
                participantId: data.participantId,
                referredTo: data.referredTo,
                reason: data.reason,
                referredById: data.referredById || 'system-user',
                status: 'PENDING',
            },
        });
    }
    async updateStatus(id, status, actor) {
        const referral = await this.prisma.referral.findUnique({ where: { id } });
        if (!referral)
            throw new common_1.NotFoundException('Referral record not found');
        await this.phi.assertParticipantAccess(actor, referral.participantId, 'PUT /referrals/:id/status');
        return this.prisma.referral.update({
            where: { id },
            data: { status },
        });
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        phi_access_service_1.PhiAccessService])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map