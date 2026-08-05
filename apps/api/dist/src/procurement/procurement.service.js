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
exports.ProcurementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProcurementService = class ProcurementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrder(data, userId) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.procurementOrder.create({
                data: {
                    itemName: data.itemName,
                    quantity: parseInt(data.quantity),
                    estimatedCost: parseFloat(data.estimatedCost),
                    vendor: data.vendor,
                    requestedById: userId,
                }
            });
            await prisma.approvalRequest.create({
                data: {
                    title: `Procurement: ${data.quantity}x ${data.itemName}`,
                    description: `Estimated Cost: $${data.estimatedCost} - Vendor: ${data.vendor}`,
                    resourceType: 'PROCUREMENT',
                    resourceId: order.id,
                    requestedById: userId,
                }
            });
            return order;
        });
    }
    async getOrders() {
        return this.prisma.procurementOrder.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                requestedBy: {
                    select: { firstName: true, lastName: true, role: true }
                }
            }
        });
    }
};
exports.ProcurementService = ProcurementService;
exports.ProcurementService = ProcurementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcurementService);
//# sourceMappingURL=procurement.service.js.map