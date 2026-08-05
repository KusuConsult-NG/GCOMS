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
exports.GrantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GrantsService = class GrantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGrant(data, userId) {
        return this.prisma.grant.create({
            data: {
                donorName: data.donorName,
                grantName: data.grantName,
                amount: parseFloat(data.amount),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                managedById: userId,
            }
        });
    }
    async getGrants() {
        return this.prisma.grant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                managedBy: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }
};
exports.GrantsService = GrantsService;
exports.GrantsService = GrantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GrantsService);
//# sourceMappingURL=grants.service.js.map