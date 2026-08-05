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
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const [totalParticipants, totalScreenings, allScreenings, pendingApprovals, activeReferrals, totalCommunities, totalOutreaches, activeProjects, recentParticipants,] = await Promise.all([
            this.prisma.participant.count(),
            this.prisma.screening.count(),
            this.prisma.screening.findMany({ select: { result: true } }),
            this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
            this.prisma.referral.count({ where: { status: 'PENDING' } }),
            this.prisma.community.count(),
            this.prisma.outreach.count(),
            this.prisma.project.count({ where: { status: 'ACTIVE' } }),
            this.prisma.participant.findMany({
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
            }),
        ]);
        const positiveScreenings = allScreenings.filter(s => s.result && s.result.toLowerCase().includes('positive')).length;
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map