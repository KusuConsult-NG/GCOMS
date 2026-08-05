import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: any, userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create ProcurementOrder
      const order = await prisma.procurementOrder.create({
        data: {
          itemName: data.itemName,
          quantity: parseInt(data.quantity),
          estimatedCost: parseFloat(data.estimatedCost),
          vendor: data.vendor,
          requestedById: userId,
        }
      });

      // 2. Create corresponding ApprovalRequest
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
}
