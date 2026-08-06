import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { money } from '../common/money';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createOrder(data: any, userId: string) {
    const created = await this.prisma.$transaction(async (prisma) => {
      // 1. Create ProcurementOrder
      const order = await prisma.procurementOrder.create({
        data: {
          itemName: data.itemName,
          quantity: parseInt(data.quantity),
          estimatedCost: parseFloat(data.estimatedCost),
          vendor: data.vendor,
          requestedById: userId,
        },
      });

      // 2. Create corresponding ApprovalRequest
      await prisma.approvalRequest.create({
        data: {
          title: `Procurement: ${data.quantity}x ${data.itemName}`,
          description: `Estimated Cost: $${data.estimatedCost} - Vendor: ${data.vendor}`,
          resourceType: 'PROCUREMENT',
          resourceId: order.id,
          requestedById: userId,
        },
      });

      return order;
    });

    // Reaches the people who can actually resolve it.
    await this.notifications.notifyApprovers(
      `Procurement: ${data.itemName}`,
      `Qty ${data.quantity} from ${data.vendor}`,
    );
    return created;
  }

  async getOrders() {
    return this.prisma.procurementOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  /** Committed spend counts approved orders only; pending is reported separately. */
  async getSummary() {
    const [approved, pending] = await Promise.all([
      this.prisma.procurementOrder.aggregate({
        _sum: { estimatedCost: true },
        _count: true,
        where: { status: 'APPROVED' },
      }),
      this.prisma.procurementOrder.aggregate({
        _sum: { estimatedCost: true },
        _count: true,
        where: { status: 'PENDING' },
      }),
    ]);
    return {
      committed: {
        count: approved._count,
        amount: money(approved._sum.estimatedCost),
      },
      awaitingApproval: {
        count: pending._count,
        amount: money(pending._sum.estimatedCost),
      },
    };
  }
}
