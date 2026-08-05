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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInventoryItem(data, userId) {
        const status = data.quantity > 0 ? (data.quantity <= 10 ? 'LOW_STOCK' : 'IN_STOCK') : 'OUT_OF_STOCK';
        return this.prisma.inventoryItem.create({
            data: {
                itemName: data.itemName,
                category: data.category,
                quantity: parseInt(data.quantity, 10),
                unit: data.unit,
                location: data.location,
                status,
                managedById: userId,
            }
        });
    }
    async getInventoryItems() {
        return this.prisma.inventoryItem.findMany({
            orderBy: { itemName: 'asc' },
            include: {
                managedBy: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }
    async updateInventoryItem(id, data) {
        const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const newQuantity = data.quantity !== undefined ? parseInt(data.quantity, 10) : item.quantity;
        const status = newQuantity > 0 ? (newQuantity <= 10 ? 'LOW_STOCK' : 'IN_STOCK') : 'OUT_OF_STOCK';
        return this.prisma.inventoryItem.update({
            where: { id },
            data: {
                quantity: newQuantity,
                status,
                ...(data.location && { location: data.location })
            }
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map