import { CreateFinanceTransactionDto } from './dto/create-transaction.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { money, toDecimal } from '../common/money';
import {
  CreateReconciliationDto,
  UpdateReconciliationDto,
} from './dto/bank-reconciliation.dto';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createTransaction(data: CreateFinanceTransactionDto, userId: string) {
    const created = await this.prisma.$transaction(async (prisma) => {
      // 1. Create FinanceTransaction
      const transaction = await prisma.financeTransaction.create({
        data: {
          amount: data.amount,
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

    // Reaches the people who can actually resolve it.
    await this.notifications.notifyApprovers(
      `Finance ${data.type}: ${data.category}`,
      `Amount: ${data.amount} — ${data.description}`,
    );
    return created;
  }

  /**
   * Ledger totals. This is where "cannot be executed before approval" actually
   * bites: a PENDING transaction is visible in its own list so the requester can
   * see it, but it does not count here. Previously PENDING was a label on a row
   * that every report added up regardless.
   */
  async getSummary() {
    const [income, expense, pending] = await Promise.all([
      this.prisma.financeTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED', type: 'INCOME' },
      }),
      this.prisma.financeTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED', type: 'EXPENSE' },
      }),
      this.prisma.financeTransaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'PENDING' },
      }),
    ]);
    const totalIncome = toDecimal(income._sum.amount);
    const totalExpense = toDecimal(expense._sum.amount);
    return {
      approvedIncome: money(totalIncome),
      approvedExpense: money(totalExpense),
      netPosition: money(totalIncome.sub(totalExpense)),
      awaitingApproval: {
        count: pending._count,
        amount: money(pending._sum.amount),
      },
    };
  }

  async getTransactions(status?: string) {
    return this.prisma.financeTransaction.findMany({
      where: status ? { status } : {},
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
