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
exports.PhiAccessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const roles_constants_1 = require("../auth/roles.constants");
let PhiAccessService = class PhiAccessService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    isUnscoped(role) {
        return roles_constants_1.PHI_UNSCOPED_ROLES.includes(role);
    }
    participantScope(actor) {
        if (this.isUnscoped(actor.role)) {
            return undefined;
        }
        return {
            OR: [
                { registeredById: actor.id },
                { assignments: { some: { clinicianId: actor.id } } },
            ],
        };
    }
    async assertParticipantAccess(actor, participantId, context) {
        if (this.isUnscoped(actor.role)) {
            return;
        }
        const scope = this.participantScope(actor);
        const inScope = await this.prisma.participant.findFirst({
            where: { id: participantId, ...scope },
            select: { id: true },
        });
        if (inScope) {
            return;
        }
        const exists = await this.prisma.participant.findUnique({
            where: { id: participantId },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('Participant not found');
        }
        await this.prisma.auditLog.create({
            data: {
                action: 'PHI_ACCESS_OVERRIDE',
                newData: JSON.stringify({
                    participantId,
                    context,
                    actorRole: actor.role,
                }),
                userId: actor.id,
            },
        });
    }
};
exports.PhiAccessService = PhiAccessService;
exports.PhiAccessService = PhiAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PhiAccessService);
//# sourceMappingURL=phi-access.service.js.map