import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createInventoryItem(data: any, userId: string) {
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

  async updateInventoryItem(id: string, data: any) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
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
}
