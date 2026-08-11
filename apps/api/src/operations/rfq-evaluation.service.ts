import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { money, toDecimal } from '../common/money';
import { SetCriteriaDto, ScoreQuoteDto } from './dto/rfq-evaluation.dto';

/**
 * Bid evaluation: a technical score that is computed rather than typed.
 *
 * The bid matrix had one box — "Score / 100" — that an evaluating officer typed
 * a number into, and a Recommend button beside it. So "automated technical
 * scoring and winner recommendation" was one person's opinion recorded to two
 * significant figures, with nothing recording what it was an opinion *about*.
 * Nobody could see why a vendor scored 84, or what the runner-up lost on.
 *
 * What replaces it is ordinary public-procurement arithmetic:
 *
 *   technical = Σ (mark ÷ scale) × weight            → 0-100
 *   financial = cheapest price ÷ this price × 100    → 0-100
 *   combined  = technical × w + financial × (1 - w)
 *
 * The marks are still human judgements — they have to be; somebody has to read
 * the bids — but each one is against a named criterion with a declared weight,
 * so the total is derived and the working is on the record.
 *
 * The recommendation follows from the combined score. It is not a separate act
 * of will, which is what the Recommend button made it.
 */
@Injectable()
export class RfqEvaluationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Replace an RFQ's criteria.
   *
   * Weights must sum to 100. That is not tidiness: a technical score is
   * meaningless if the denominator is whatever the weights happened to add up
   * to, and "out of 87" scored against "out of 100" is how two bids become
   * incomparable without anyone noticing.
   */
  async setCriteria(rfqId: string, dto: SetCriteriaDto) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: rfqId },
      include: { quotes: { select: { id: true, status: true } } },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const total = dto.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (total !== 100) {
      throw new BadRequestException(
        `Criterion weights must sum to 100; these sum to ${total}.`,
      );
    }

    // Changing what a bid is judged on after it has been judged invalidates
    // every mark already given, and silently rescoring against new criteria is
    // how an evaluation ends up meaning something nobody agreed to.
    if (rfq.status === 'COMPLETE') {
      throw new ConflictException(
        'This RFQ has been evaluated. Its criteria can no longer be changed.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.rfqCriterion.deleteMany({ where: { rfqId } });
      await tx.rfqCriterion.createMany({
        data: dto.criteria.map((c, position) => ({
          rfqId,
          label: c.label.trim(),
          weight: c.weight,
          maxScore: c.maxScore ?? 10,
          position,
        })),
      });
      if (dto.technicalWeight !== undefined) {
        await tx.rfq.update({
          where: { id: rfqId },
          data: { technicalWeight: dto.technicalWeight },
        });
      }
      return tx.rfqCriterion.findMany({
        where: { rfqId },
        orderBy: { position: 'asc' },
      });
    });
  }

  listCriteria(rfqId: string) {
    return this.prisma.rfqCriterion.findMany({
      where: { rfqId },
      orderBy: { position: 'asc' },
    });
  }

  /** Record one evaluator's marks for one quote. */
  async scoreQuote(quoteId: string, dto: ScoreQuoteDto) {
    const quote = await this.prisma.rfqQuote.findUnique({
      where: { id: quoteId },
      include: { rfq: { include: { criteria: true } } },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const criteria = new Map(quote.rfq.criteria.map((c) => [c.id, c]));
    for (const mark of dto.scores) {
      const criterion = criteria.get(mark.criterionId);
      if (!criterion) {
        throw new BadRequestException(
          'A mark refers to a criterion that does not belong to this RFQ.',
        );
      }
      // A mark above the scale silently inflates the weighted total, which is
      // the one number the recommendation turns on.
      if (mark.score > criterion.maxScore) {
        throw new BadRequestException(
          `"${criterion.label}" is marked out of ${criterion.maxScore}; ` +
            `${mark.score} is above that.`,
        );
      }
    }

    await this.prisma.$transaction(
      dto.scores.map((mark) =>
        this.prisma.quoteCriterionScore.upsert({
          where: {
            quoteId_criterionId: { quoteId, criterionId: mark.criterionId },
          },
          update: { score: mark.score, note: mark.note?.trim() || null },
          create: {
            quoteId,
            criterionId: mark.criterionId,
            score: mark.score,
            note: mark.note?.trim() || null,
          },
        }),
      ),
    );

    return this.prisma.quoteCriterionScore.findMany({ where: { quoteId } });
  }

  /**
   * Score every quote on the RFQ and recommend one.
   *
   * Deliberately refuses rather than guesses in three places, because each of
   * them is a way for a vendor to win by accident:
   *
   *  - no criteria: there is nothing to be technical about.
   *  - an unmarked criterion on any quote: an unscored bid would score zero on
   *    that line and lose for a reason nobody decided, or — worse, if unmarked
   *    counted as full marks — win for one.
   *  - a tie on the combined score: the buyer breaks it, not the sort order.
   */
  async evaluate(rfqId: string, actorId: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: rfqId },
      include: {
        criteria: { orderBy: { position: 'asc' } },
        quotes: {
          include: {
            vendor: { select: { id: true, name: true } },
            criterionScores: true,
          },
        },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    if (rfq.criteria.length === 0) {
      throw new BadRequestException(
        'This RFQ has no evaluation criteria, so there is nothing to score ' +
          'the bids against. Set them before evaluating.',
      );
    }
    const eligible = rfq.quotes.filter((q) => q.status !== 'REJECTED');
    if (eligible.length === 0) {
      throw new BadRequestException('No quotes to evaluate.');
    }

    const unmarked: string[] = [];
    for (const quote of eligible) {
      const marked = new Set(quote.criterionScores.map((s) => s.criterionId));
      const missing = rfq.criteria.filter((c) => !marked.has(c.id));
      if (missing.length) {
        unmarked.push(
          `${quote.vendor.name}: ${missing.map((c) => c.label).join(', ')}`,
        );
      }
    }
    if (unmarked.length) {
      throw new BadRequestException(
        `Every quote must be marked against every criterion before the RFQ ` +
          `can be evaluated. Outstanding — ${unmarked.join('; ')}.`,
      );
    }

    // The cheapest compliant price is the reference for the price score.
    const cheapest = eligible.reduce(
      (low, q) => (toDecimal(q.price).lt(low) ? toDecimal(q.price) : low),
      toDecimal(eligible[0].price),
    );

    const technicalWeight = new Prisma.Decimal(rfq.technicalWeight).div(100);
    const financialWeight = new Prisma.Decimal(1).sub(technicalWeight);

    const scored = eligible.map((quote) => {
      const marks = new Map(
        quote.criterionScores.map((s) => [s.criterionId, s.score]),
      );

      let technical = new Prisma.Decimal(0);
      const breakdown = rfq.criteria.map((c) => {
        const mark = marks.get(c.id) ?? 0;
        // (mark ÷ scale) × weight, in Decimal — a technical score is compared
        // against other bids and the difference is often a point or two.
        const contribution = new Prisma.Decimal(mark)
          .div(c.maxScore)
          .mul(c.weight);
        technical = technical.add(contribution);
        return {
          criterionId: c.id,
          label: c.label,
          weight: c.weight,
          maxScore: c.maxScore,
          mark,
          contribution: money(contribution),
        };
      });

      const price = toDecimal(quote.price);
      // Guards a free bid, which would otherwise divide by zero and score
      // every other vendor at nothing.
      const financial = price.gt(0)
        ? cheapest.div(price).mul(100)
        : new Prisma.Decimal(100);

      const combined = technical
        .mul(technicalWeight)
        .add(financial.mul(financialWeight));

      return {
        quoteId: quote.id,
        vendorId: quote.vendor.id,
        vendorName: quote.vendor.name,
        price: money(price),
        technicalScore: Math.round(technical.toNumber()),
        financialScore: Math.round(financial.toNumber()),
        combinedScore: Math.round(combined.toNumber()),
        breakdown,
      };
    });

    scored.sort((a, b) => b.combinedScore - a.combinedScore);

    const top = scored[0];
    const tied = scored.filter((s) => s.combinedScore === top.combinedScore);
    if (tied.length > 1) {
      throw new ConflictException(
        `Cannot recommend automatically: ${tied
          .map((t) => t.vendorName)
          .join(' and ')} are tied on ${top.combinedScore}. Adjust the ` +
          'criteria weights or the marks, or record the decision manually.',
      );
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      for (const row of scored) {
        await tx.rfqQuote.update({
          where: { id: row.quoteId },
          data: {
            score: row.technicalScore,
            financialScore: row.financialScore,
            combinedScore: row.combinedScore,
            evaluatedAt: now,
            status: row.quoteId === top.quoteId ? 'RECOMMENDED' : 'SUBMITTED',
          },
        });
      }
      await tx.rfq.update({
        where: { id: rfqId },
        data: { status: 'COMPLETE' },
      });
      // An award decides who gets public money. Same standing as an approval.
      await tx.auditLog.create({
        data: {
          action: 'RFQ_EVALUATED',
          newData: JSON.stringify({
            rfqId,
            reference: rfq.reference,
            recommended: { vendor: top.vendorName, score: top.combinedScore },
            ranking: scored.map((s) => ({
              vendor: s.vendorName,
              combined: s.combinedScore,
            })),
          }),
          userId: actorId,
        },
      });
    });

    return {
      rfqId,
      reference: rfq.reference,
      technicalWeight: rfq.technicalWeight,
      financialWeight: 100 - rfq.technicalWeight,
      evaluatedAt: now,
      recommended: { quoteId: top.quoteId, vendorName: top.vendorName },
      ranking: scored,
    };
  }
}
