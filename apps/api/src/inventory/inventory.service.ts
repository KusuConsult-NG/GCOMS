import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
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

  /** Status follows from the quantity and the item's own reorder point. */
  private statusFor(quantity: number, minThreshold: number): string {
    if (quantity <= 0) return 'OUT_OF_STOCK';
    return quantity <= minThreshold ? 'LOW_STOCK' : 'IN_STOCK';
  }

  async createInventoryItem(data: CreateInventoryItemDto, userId: string) {
    const minThreshold = data.minThreshold ?? 10;
    const status = this.statusFor(data.quantity, minThreshold);
    return this.prisma.inventoryItem.create({
      data: {
        itemName: data.itemName,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        location: data.location,
        minThreshold,
        unitPrice: data.unitPrice ?? null,
        assetTag: data.assetTag?.trim() || null,
        serialNumber: data.serialNumber?.trim() || null,
        currentLocation: data.currentLocation?.trim() || null,
        assignedTo: data.assignedTo?.trim() || null,
        condition: data.condition ?? null,
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

  async updateInventoryItem(id: string, data: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const newQuantity = data.quantity ?? item.quantity;
    const minThreshold = data.minThreshold ?? item.minThreshold;
    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQuantity,
        minThreshold,
        status: this.statusFor(newQuantity, minThreshold),
        ...(data.location && { location: data.location }),
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(data.assetTag !== undefined && { assetTag: data.assetTag || null }),
        ...(data.serialNumber !== undefined && {
          serialNumber: data.serialNumber || null,
        }),
        ...(data.currentLocation !== undefined && {
          currentLocation: data.currentLocation || null,
        }),
        ...(data.assignedTo !== undefined && {
          assignedTo: data.assignedTo || null,
        }),
        ...(data.condition !== undefined && { condition: data.condition }),
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
