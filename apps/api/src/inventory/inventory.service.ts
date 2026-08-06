import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateServiceLogDto,
  UpdateServiceLogDto,
} from './dto/service-log.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createInventoryItem(data: any, userId: string) {
    const status =
      data.quantity > 0
        ? data.quantity <= 10
          ? 'LOW_STOCK'
          : 'IN_STOCK'
        : 'OUT_OF_STOCK';
    return this.prisma.inventoryItem.create({
      data: {
        itemName: data.itemName,
        category: data.category,
        quantity: parseInt(data.quantity, 10),
        unit: data.unit,
        location: data.location,
        status,
        managedById: userId,
      },
    });
  }

  async getInventoryItems() {
    return this.prisma.inventoryItem.findMany({
      orderBy: { itemName: 'asc' },
      include: {
        managedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  async updateInventoryItem(id: string, data: any) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const newQuantity =
      data.quantity !== undefined ? parseInt(data.quantity, 10) : item.quantity;
    const status =
      newQuantity > 0
        ? newQuantity <= 10
          ? 'LOW_STOCK'
          : 'IN_STOCK'
        : 'OUT_OF_STOCK';

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQuantity,
        status,
        ...(data.location && { location: data.location }),
      },
    });
  }

  /* EquipmentServiceLog had no endpoint; maintenance screens were local state. */

  async listServiceLogs(query: { inventoryItemId?: string; status?: string }) {
    const where: Prisma.EquipmentServiceLogWhereInput = {};
    if (query.inventoryItemId) where.inventoryItemId = query.inventoryItemId;
    if (query.status) where.status = query.status;
    return this.prisma.equipmentServiceLog.findMany({
      where,
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async createServiceLog(dto: CreateServiceLogDto) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.inventoryItemId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    if (new Date(dto.nextDueDate) < new Date(dto.serviceDate)) {
      throw new BadRequestException('nextDueDate cannot be before serviceDate');
    }

    return this.prisma.equipmentServiceLog.create({
      data: {
        inventoryItemId: dto.inventoryItemId,
        serviceType: dto.serviceType,
        performedBy: dto.performedBy.trim(),
        serviceDate: new Date(dto.serviceDate),
        nextDueDate: new Date(dto.nextDueDate),
        cost: dto.cost ?? 0,
        status: dto.status ?? 'COMPLETED',
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async updateServiceLog(id: string, dto: UpdateServiceLogDto) {
    const existing = await this.prisma.equipmentServiceLog.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Service log not found');

    const serviceDate = dto.serviceDate
      ? new Date(dto.serviceDate)
      : existing.serviceDate;
    const nextDueDate = dto.nextDueDate
      ? new Date(dto.nextDueDate)
      : existing.nextDueDate;
    if (nextDueDate < serviceDate) {
      throw new BadRequestException('nextDueDate cannot be before serviceDate');
    }

    const data: Prisma.EquipmentServiceLogUpdateInput = {
      serviceDate,
      nextDueDate,
    };
    if (dto.serviceType !== undefined) data.serviceType = dto.serviceType;
    if (dto.performedBy !== undefined)
      data.performedBy = dto.performedBy.trim();
    if (dto.cost !== undefined) data.cost = dto.cost;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes.trim() || null;
    return this.prisma.equipmentServiceLog.update({ where: { id }, data });
  }
}
