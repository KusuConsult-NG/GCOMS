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
exports.StrategyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StrategyService = class StrategyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGoal(data) {
        return this.prisma.strategicGoal.create({
            data: {
                title: data.title,
                targetMetric: data.targetMetric,
                deadline: new Date(data.deadline),
                status: 'ON_TRACK'
            }
        });
    }
    async getGoals() {
        return this.prisma.strategicGoal.findMany({
            orderBy: { deadline: 'asc' }
        });
    }
    async updateGoal(id, data) {
        const goal = await this.prisma.strategicGoal.findUnique({ where: { id } });
        if (!goal)
            throw new common_1.NotFoundException('Strategic Goal not found');
        let status = 'ON_TRACK';
        if (data.currentMetric >= goal.targetMetric) {
            status = 'COMPLETED';
        }
        else if (new Date() > goal.deadline) {
            status = 'AT_RISK';
        }
        return this.prisma.strategicGoal.update({
            where: { id },
            data: {
                currentMetric: data.currentMetric,
                status
            }
        });
    }
};
exports.StrategyService = StrategyService;
exports.StrategyService = StrategyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StrategyService);
//# sourceMappingURL=strategy.service.js.map