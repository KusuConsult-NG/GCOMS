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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const phi_access_service_1 = require("../phi/phi-access.service");
const roles_constants_1 = require("../auth/roles.constants");
let DashboardService = class DashboardService {
    prisma;
    phi;
    constructor(prisma, phi) {
        this.prisma = prisma;
        this.phi = phi;
    }
    async getStats(actor) {
        const scope = this.phi.participantScope(actor);
        const participantWhere = scope ?? {};
        const byParticipant = scope ? { participant: scope } : {};
        const mayReadPhi = roles_constants_1.PHI_READ_ROLES.includes(actor.role);
        const [totalParticipants, totalScreenings, allScreenings, pendingApprovals, activeReferrals, totalCommunities, totalOutreaches, activeProjects, recentParticipants,] = await Promise.all([
            this.prisma.participant.count({ where: participantWhere }),
            this.prisma.screening.count({ where: byParticipant }),
            this.prisma.screening.findMany({
                where: byParticipant,
                select: { result: true },
            }),
            this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
            this.prisma.referral.count({
                where: { status: 'PENDING', ...byParticipant },
            }),
            this.prisma.community.count(),
            this.prisma.outreach.count(),
            this.prisma.project.count({ where: { status: 'ACTIVE' } }),
            mayReadPhi
                ? this.prisma.participant.findMany({
                    where: participantWhere,
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        nationalId: true,
                        gender: true,
                        createdAt: true,
                    },
                })
                : Promise.resolve([]),
        ]);
        const positiveScreenings = allScreenings.filter((s) => s.result && s.result.toLowerCase().includes('positive')).length;
        return {
            totalParticipants,
            totalScreenings,
            positiveScreenings,
            highRiskCases: positiveScreenings,
            pendingApprovals,
            activeReferrals,
            totalCommunities,
            totalOutreaches,
            activeProjects,
            pendingFollowUps: 0,
            recentParticipants,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        phi_access_service_1.PhiAccessService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map