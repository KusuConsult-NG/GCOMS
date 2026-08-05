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
exports.VitalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VitalsService = class VitalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        let bmi;
        if (data.weightKg && data.heightCm && data.heightCm > 0) {
            const heightM = data.heightCm / 100;
            bmi = parseFloat((data.weightKg / (heightM * heightM)).toFixed(1));
        }
        return this.prisma.vitalSign.create({
            data: {
                ...data,
                bmi,
            },
        });
    }
    async findByParticipant(participantId) {
        return this.prisma.vitalSign.findMany({
            where: { participantId },
            orderBy: { recordedAt: 'desc' },
        });
    }
};
exports.VitalsService = VitalsService;
exports.VitalsService = VitalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VitalsService);
//# sourceMappingURL=vitals.service.js.map