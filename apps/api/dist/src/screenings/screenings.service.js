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
exports.ScreeningsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ScreeningsService = class ScreeningsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateRiskScore(data) {
        let baseScore = 2.0;
        if (data.result.toUpperCase().includes('POSITIVE')) {
            baseScore += 6.0;
        }
        else if (data.result.toUpperCase().includes('SUSPICIOUS')) {
            baseScore += 4.0;
        }
        else {
            baseScore += 0.5;
        }
        if (data.cancerType.toLowerCase().includes('cervical')) {
            baseScore += 1.0;
        }
        else if (data.cancerType.toLowerCase().includes('breast')) {
            baseScore += 0.8;
        }
        const participant = await this.prisma.participant.findUnique({
            where: { id: data.participantId },
        });
        if (participant && participant.dateOfBirth) {
            const age = Math.floor((Date.now() - new Date(participant.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            if (age > 50)
                baseScore += 1.0;
            else if (age > 40)
                baseScore += 0.5;
        }
        return Math.min(10.0, parseFloat(baseScore.toFixed(1)));
    }
    async createScreening(data, userId) {
        const riskScore = data.riskScore
            ? parseFloat(data.riskScore)
            : await this.calculateRiskScore(data);
        return this.prisma.screening.create({
            data: {
                cancerType: data.cancerType,
                result: data.result,
                riskScore,
                participantId: data.participantId,
                conductedById: userId,
            },
            include: {
                participant: { select: { firstName: true, lastName: true, nationalId: true } },
            },
        });
    }
    async getScreenings(participantId) {
        return this.prisma.screening.findMany({
            where: { participantId },
            orderBy: { createdAt: 'desc' },
            include: {
                conductedBy: { select: { firstName: true, lastName: true, role: true } },
            },
        });
    }
};
exports.ScreeningsService = ScreeningsService;
exports.ScreeningsService = ScreeningsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScreeningsService);
//# sourceMappingURL=screenings.service.js.map