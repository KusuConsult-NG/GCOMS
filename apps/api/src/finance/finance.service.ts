import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  CreateReconciliationDto,
  UpdateReconciliationDto,
} from './dto/bank-reconciliation.dto';

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

  /* BankReconciliation had no endpoint; the reconciliation screen was local state. */

  async listReconciliations(status?: string) {
    return this.prisma.bankReconciliation.findMany({
      where: status ? { status } : {},
      orderBy: { statementDate: 'desc' },
    });
  }

  async createReconciliation(dto: CreateReconciliationDto) {
    // Discrepancy and status are computed, never accepted from the client — a
    // reconciliation that can claim it balances while the figures disagree is
    // worse than no reconciliation at all.
    const discrepancy = Number(
      (dto.bankBalance - dto.ledgerBalance).toFixed(2),
    );
    return this.prisma.bankReconciliation.create({
      data: {
        statementDate: new Date(dto.statementDate),
        bankBalance: dto.bankBalance,
        ledgerBalance: dto.ledgerBalance,
        discrepancy,
        status: discrepancy === 0 ? 'RECONCILED' : 'DISCREPANCY',
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async updateReconciliation(id: string, dto: UpdateReconciliationDto) {
    const existing = await this.prisma.bankReconciliation.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Reconciliation not found');

    const bankBalance = dto.bankBalance ?? existing.bankBalance;
    const ledgerBalance = dto.ledgerBalance ?? existing.ledgerBalance;
    const discrepancy = Number((bankBalance - ledgerBalance).toFixed(2));

    return this.prisma.bankReconciliation.update({
      where: { id },
      data: {
        bankBalance,
        ledgerBalance,
        discrepancy,
        status:
          dto.status ?? (discrepancy === 0 ? 'RECONCILED' : 'DISCREPANCY'),
        notes:
          dto.notes !== undefined ? dto.notes.trim() || null : existing.notes,
      },
    });
  }
}
