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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getExecutiveSummary() {
        const [totalScreenings, allScreenings, totalPatients, totalOutreaches, totalReferrals, activeReferrals, totalNavigationEvents, communitiesCovered,] = await Promise.all([
            this.prisma.screening.count(),
            this.prisma.screening.findMany({ select: { result: true } }),
            this.prisma.participant.count(),
            this.prisma.outreach.count(),
            this.prisma.referral.count(),
            this.prisma.referral.count({ where: { status: 'PENDING' } }),
            this.prisma.navigationEvent.count(),
            this.prisma.community.count(),
        ]);
        const positiveScreenings = allScreenings.filter(s => s.result && s.result.toLowerCase().includes('positive')).length;
        return {
            generatedAt: new Date(),
            totalScreenings,
            positiveScreenings,
            totalPatients,
            totalOutreaches,
            communitiesCovered,
            reachStats: {
                awareness: totalOutreaches * 50,
                screenings: totalScreenings,
                navigation: totalNavigationEvents,
                referrals: totalReferrals,
                activeReferrals,
            },
        };
    }
    async exportReportData() {
        const screenings = await this.prisma.screening.findMany({
            include: {
                participant: {
                    select: { firstName: true, lastName: true, nationalId: true, gender: true },
                },
                conductedBy: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return screenings.map(s => ({
            ID: s.id,
            CancerType: s.cancerType,
            Result: s.result,
            RiskScore: s.riskScore,
            Participant: `${s.participant?.firstName || ''} ${s.participant?.lastName || ''}`.trim(),
            NationalID: s.participant?.nationalId || '',
            Gender: s.participant?.gender || '',
            ConductedBy: s.conductedBy ? `${s.conductedBy.firstName} ${s.conductedBy.lastName}` : 'N/A',
            Date: s.createdAt,
        }));
    }
    async getParticipantReport() {
        return this.prisma.participant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                screenings: { select: { cancerType: true, result: true, createdAt: true } },
                referrals: { select: { referredTo: true, status: true } },
                navigationEvents: { select: { eventType: true, date: true } },
            },
        });
    }
    async getFinancialReport() {
        const [income, expenses, grants] = await Promise.all([
            this.prisma.financeTransaction.findMany({ where: { type: 'INCOME' } }),
            this.prisma.financeTransaction.findMany({ where: { type: 'EXPENSE' } }),
            this.prisma.grant.findMany({ select: { grantName: true, amount: true, status: true } }),
        ]);
        const totalIncome = income.reduce((s, t) => s + t.amount, 0);
        const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
        const totalGrantFunding = grants.reduce((s, g) => s + (g.amount || 0), 0);
        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            totalGrantFunding,
            transactions: [...income, ...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            grants,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map