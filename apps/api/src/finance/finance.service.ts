import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(data: any, userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create FinanceTransaction
      const transaction = await prisma.financeTransaction.create({
        data: {
          amount: parseFloat(data.amount),
          type: data.type,
          category: data.category,
          description: data.description,
          requestedById: userId,
        },
      });

      // 2. Create corresponding ApprovalRequest
      await prisma.approvalRequest.create({
        data: {
          title: `Finance ${data.type}: ${data.category}`,
          description: `Amount: $${data.amount} - ${data.description}`,
          resourceType: 'FINANCE',
          resourceId: transaction.id,
          requestedById: userId,
        },
      });

      return transaction;
    });
  }

  async getTransactions() {
    return this.prisma.financeTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });
  }
}
