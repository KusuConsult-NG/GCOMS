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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary() {
        const [totalScreenings, allScreenings, activeProjects, allGrants, pendingApprovals, totalParticipants, activeReferrals, communitiesCovered, totalOutreaches, researchProjects, totalStaff, patientsUnderNavigation,] = await Promise.all([
            this.prisma.screening.count(),
            this.prisma.screening.findMany({ select: { result: true } }),
            this.prisma.project.count({ where: { status: 'ACTIVE' } }),
            this.prisma.grant.findMany({ select: { amount: true } }),
            this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
            this.prisma.participant.count(),
            this.prisma.referral.count({ where: { status: 'PENDING' } }),
            this.prisma.community.count(),
            this.prisma.outreach.count(),
            this.prisma.researchProject.count(),
            this.prisma.staffRecord.count({ where: { status: 'ACTIVE' } }),
            this.prisma.patientAssignment.count({ where: { status: 'ACTIVE' } }),
        ]);
        const positiveScreenings = allScreenings.filter(s => s.result && s.result.toLowerCase().includes('positive')).length;
        const totalFunding = allGrants.reduce((sum, g) => sum + (g.amount || 0), 0);
        return {
            totalScreenings,
            positiveScreenings,
            activeProjects,
            totalFunding,
            pendingApprovals,
            totalParticipants,
            activeReferrals,
            communitiesCovered,
            totalOutreaches,
            researchProjects,
            totalStaff,
            patientsUnderNavigation,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map