import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { money, toDecimal } from '../common/money';
import { CreateJournalEntryDto } from './dto/journal-entry.dto';
import { ACCOUNT_TYPES, NORMAL_BALANCES } from '../auth/roles.constants';

/**
 * The general ledger: journal vouchers with two sides, and the rule that makes
 * them a ledger rather than a list.
 *
 * The finance screen called itself a "Real-Time Double-Entry General Ledger"
 * over FinanceTransaction — one row, one amount, one type. There were no debit
 * and credit legs, nothing to post them against, and nothing that could fail to
 * balance, so the name promised a control that did not exist. This is that
 * control.
 *
 * Everything below runs in Decimal. A ledger that balances to within a floating
 * point epsilon does not balance; `0.1 + 0.2 !== 0.3` is exactly the kind of
 * difference an unbalanced entry is made of, and it is the difference an
 * auditor asks about.
 */
@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  listAccounts(activeOnly = true) {
    return this.prisma.ledgerAccount.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Post a voucher.
   *
   * The whole point of the module is the check in the middle: an entry whose
   * debits and credits differ is refused, and refused before anything is
   * written. Nothing repairs an unbalanced entry afterwards — a ledger with one
   * in it has to be reconciled by hand, and the person doing that will not be
   * the person who posted it.
   */
  async postEntry(dto: CreateJournalEntryDto, actorId: string) {
    if (dto.lines.length < 2) {
      throw new BadRequestException(
        'A journal entry needs at least two lines: something is debited and ' +
          'something is credited.',
      );
    }

    let debits = new Prisma.Decimal(0);
    let credits = new Prisma.Decimal(0);

    for (const [index, line] of dto.lines.entries()) {
      const debit = toDecimal(line.debit ?? 0);
      const credit = toDecimal(line.credit ?? 0);

      // A line is one side or the other. Allowing both makes the entry's total
      // ambiguous — is a line of 100/40 a debit of 60, or two postings? — and
      // allowing neither is a line that means nothing.
      if (debit.gt(0) && credit.gt(0)) {
        throw new BadRequestException(
          `Line ${index + 1} has both a debit and a credit. A line is one or ` +
            'the other.',
        );
      }
      if (debit.lte(0) && credit.lte(0)) {
        throw new BadRequestException(
          `Line ${index + 1} has no amount. Every line debits or credits ` +
            'something.',
        );
      }
      debits = debits.add(debit);
      credits = credits.add(credit);
    }

    if (!debits.equals(credits)) {
      throw new BadRequestException(
        `The entry does not balance: debits ${money(debits)} against credits ` +
          `${money(credits)}, a difference of ${money(debits.sub(credits).abs())}.`,
      );
    }

    const accountIds = [...new Set(dto.lines.map((l) => l.accountId))];
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, isActive: true, code: true },
    });
    if (accounts.length !== accountIds.length) {
      throw new BadRequestException(
        'One of the lines posts to an account that does not exist.',
      );
    }
    const closed = accounts.filter((a) => !a.isActive);
    if (closed.length) {
      throw new BadRequestException(
        `Cannot post to closed account(s): ${closed.map((a) => a.code).join(', ')}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Reference is assigned here rather than taken from the client: a voucher
      // number a caller can choose is a voucher number two callers can choose.
      const year = new Date(dto.entryDate).getUTCFullYear();
      const countThisYear = await tx.journalEntry.count({
        where: {
          entryDate: {
            gte: new Date(Date.UTC(year, 0, 1)),
            lt: new Date(Date.UTC(year + 1, 0, 1)),
          },
        },
      });
      const reference = `JV-${year}-${String(countThisYear + 1).padStart(5, '0')}`;

      const entry = await tx.journalEntry.create({
        data: {
          reference,
          entryDate: new Date(dto.entryDate),
          description: dto.description,
          sourceTransactionId: dto.sourceTransactionId ?? null,
          postedById: actorId,
          lines: {
            create: dto.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.debit ?? 0,
              credit: line.credit ?? 0,
              narration: line.narration?.trim() || null,
            })),
          },
        },
        include: { lines: { include: { account: true } } },
      });

      // A posting is a financial event, and the spec asks those to leave an
      // unalterable record. Written inside the transaction, like the others.
      await tx.auditLog.create({
        data: {
          action: 'JOURNAL_ENTRY_POSTED',
          newData: JSON.stringify({
            entryId: entry.id,
            reference,
            total: money(debits),
            lines: entry.lines.length,
          }),
          userId: actorId,
        },
      });

      return entry;
    });
  }

  async listEntries(limit = 100) {
    return this.prisma.journalEntry.findMany({
      orderBy: [{ entryDate: 'desc' }, { reference: 'desc' }],
      take: limit,
      include: {
        lines: { include: { account: true } },
        postedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getEntry(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: { include: { account: true } },
        postedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  /**
   * The trial balance, and the proof.
   *
   * Every account with its debit and credit totals, plus the two grand totals.
   * They are equal by construction — nothing can be posted that would make them
   * differ — so the useful thing this returns is `inBalance`, which is a claim
   * the system is willing to have checked rather than one it merely makes.
   */
  async trialBalance() {
    const [accounts, totals] = await Promise.all([
      this.prisma.ledgerAccount.findMany({ orderBy: { code: 'asc' } }),
      this.prisma.journalLine.groupBy({
        by: ['accountId'],
        _sum: { debit: true, credit: true },
      }),
    ]);

    const byAccount = new Map(totals.map((t) => [t.accountId, t]));
    let totalDebits = new Prisma.Decimal(0);
    let totalCredits = new Prisma.Decimal(0);

    const rows = accounts.map((account) => {
      const sums = byAccount.get(account.id);
      const debit = toDecimal(sums?._sum.debit);
      const credit = toDecimal(sums?._sum.credit);
      totalDebits = totalDebits.add(debit);
      totalCredits = totalCredits.add(credit);

      // Presented on the side the account normally sits, so a reader does not
      // have to work out which way each one faces.
      const net =
        account.normalBalance === 'DEBIT'
          ? debit.sub(credit)
          : credit.sub(debit);

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        debit: money(debit),
        credit: money(credit),
        balance: money(net),
      };
    });

    return {
      rows,
      totalDebits: money(totalDebits),
      totalCredits: money(totalCredits),
      difference: money(totalDebits.sub(totalCredits)),
      inBalance: totalDebits.equals(totalCredits),
    };
  }

  /** Used by the seed and by tests; the account set is reference data. */
  static readonly ACCOUNT_TYPES = ACCOUNT_TYPES;
  static readonly NORMAL_BALANCES = NORMAL_BALANCES;
}
