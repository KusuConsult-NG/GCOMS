import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OperationsService } from './operations.service';

/**
 * The three records that previously had no table: annual plan items, goods
 * received notes and contracts. These cover what each refuses as much as what
 * each stores — the plan's total is derived rather than kept, a GRN cannot
 * receive more than was ordered, and a contract cannot end before it starts.
 */
describe('OperationsService — plan items, GRNs and contracts', () => {
  let service: OperationsService;
  let prisma: {
    procurementPlanItem: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    procurementOrder: { findUnique: jest.Mock };
    goodsReceivedNote: { findMany: jest.Mock; create: jest.Mock };
    vendor: { findUnique: jest.Mock };
    contract: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const ACTOR = 'user-1';

  /**
   * The argument a mocked call received, typed at the call site.
   *
   * `jest.Mock` without type parameters types `mock.calls` as `any[][]`, so
   * every assertion that reaches into a recorded argument is unchecked — which
   * is exactly where a renamed field would slip through as undefined and the
   * expectation would quietly pass.
   */
  const argOf = <T>(mock: jest.Mock, call = 0): T =>
    (mock.mock.calls as unknown[][])[call][0] as T;
  const dec = (v: string | number) => new Prisma.Decimal(v);

  beforeEach(async () => {
    prisma = {
      procurementPlanItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      procurementOrder: { findUnique: jest.fn() },
      goodsReceivedNote: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      vendor: { findUnique: jest.fn() },
      contract: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        OperationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(OperationsService);
  });

  describe('plan items', () => {
    it('derives totalCost from quantity and unitPrice rather than storing it', async () => {
      prisma.procurementPlanItem.create.mockResolvedValue({
        id: 'p1',
        quantity: 3,
        unitPrice: dec('1250.75'),
      });

      const item = await service.createPlanItem(
        {
          category: 'Reagents',
          description: 'VIA kits',
          quantity: 3,
          unitPrice: 1250.75,
        },
        ACTOR,
      );

      expect(item.totalCost).toBe(3752.25);
      // Nothing named total is written — the column does not exist.
      const written = argOf<{
        data: Record<string, unknown>;
      }>(prisma.procurementPlanItem.create);
      expect(Object.keys(written.data)).not.toContain('totalCost');
    });

    it('multiplies in Decimal, so the total does not drift', async () => {
      prisma.procurementPlanItem.create.mockResolvedValue({
        id: 'p1',
        quantity: 3,
        unitPrice: dec('0.1'),
      });

      const item = await service.createPlanItem(
        { category: 'x', description: 'y', quantity: 3, unitPrice: 0.1 },
        ACTOR,
      );

      // 0.1 * 3 is 0.30000000000000004 in binary floating point.
      expect(item.totalCost).toBe(0.3);
    });

    it('defaults the fiscal year to the current one', async () => {
      prisma.procurementPlanItem.create.mockResolvedValue({
        quantity: 1,
        unitPrice: dec(1),
      });

      await service.createPlanItem(
        { category: 'x', description: 'y', quantity: 1, unitPrice: 1 },
        ACTOR,
      );

      const written = argOf<{
        data: { fiscalYear: number };
      }>(prisma.procurementPlanItem.create);
      expect(written.data.fiscalYear).toBe(new Date().getFullYear());
    });

    it('rejects an update to a plan item that does not exist', async () => {
      prisma.procurementPlanItem.findUnique.mockResolvedValue(null);
      await expect(
        service.updatePlanItem('missing', { status: 'APPROVED' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('goods received notes', () => {
    const grn = {
      procurementOrderId: '11111111-1111-1111-1111-111111111111',
      deliveryNote: 'DN-1',
      itemsReceived: 'VIA kits',
      quantity: 5,
      inspectionDate: '2026-08-01T00:00:00.000Z',
      officer: 'A. Officer',
    };

    it('allocates a GRN reference in sequence', async () => {
      prisma.procurementOrder.findUnique.mockResolvedValue({
        id: grn.procurementOrderId,
        quantity: 20,
      });
      prisma.goodsReceivedNote.findMany.mockResolvedValue([
        { reference: `GRN-${new Date().getFullYear()}-0003` },
      ]);
      prisma.goodsReceivedNote.create.mockResolvedValue({ id: 'g1' });

      await service.createGrn(grn, ACTOR);

      const written = argOf<{
        data: { reference: string };
      }>(prisma.goodsReceivedNote.create);
      expect(written.data.reference).toBe(
        `GRN-${new Date().getFullYear()}-0004`,
      );
    });

    it('refuses a note against a purchase order that does not exist', async () => {
      prisma.procurementOrder.findUnique.mockResolvedValue(null);
      await expect(service.createGrn(grn, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.goodsReceivedNote.create).not.toHaveBeenCalled();
    });

    it('refuses to receive more than was ordered', async () => {
      prisma.procurementOrder.findUnique.mockResolvedValue({
        id: grn.procurementOrderId,
        quantity: 4,
      });
      await expect(service.createGrn(grn, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.goodsReceivedNote.create).not.toHaveBeenCalled();
    });

    it('accepts receiving exactly the ordered quantity', async () => {
      prisma.procurementOrder.findUnique.mockResolvedValue({
        id: grn.procurementOrderId,
        quantity: 5,
      });
      prisma.goodsReceivedNote.create.mockResolvedValue({ id: 'g1' });
      await expect(service.createGrn(grn, ACTOR)).resolves.toEqual({
        id: 'g1',
      });
    });
  });

  describe('contracts', () => {
    const VENDOR = '22222222-2222-2222-2222-222222222222';
    const contract = {
      vendorId: VENDOR,
      title: 'Reagent supply',
      value: 5_000_000,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
    };

    it('allocates a contract reference and records the author', async () => {
      prisma.vendor.findUnique.mockResolvedValue({ id: VENDOR });
      prisma.contract.create.mockResolvedValue({ id: 'c1' });

      await service.createContract(contract, ACTOR);

      const written = argOf<{
        data: { reference: string; createdById: string };
      }>(prisma.contract.create);
      expect(written.data.reference).toBe(
        `CTR-${new Date().getFullYear()}-0001`,
      );
      expect(written.data.createdById).toBe(ACTOR);
    });

    it('refuses a contract for an unregistered vendor', async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);
      await expect(service.createContract(contract, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.contract.create).not.toHaveBeenCalled();
    });

    it('refuses an end date before the start date', async () => {
      prisma.vendor.findUnique.mockResolvedValue({ id: VENDOR });
      await expect(
        service.createContract(
          { ...contract, endDate: '2025-01-01T00:00:00.000Z' },
          ACTOR,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.contract.create).not.toHaveBeenCalled();
    });

    it('refuses an update that would end the contract before it started', async () => {
      prisma.contract.findUnique.mockResolvedValue({
        id: 'c1',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
      });
      await expect(
        service.updateContract('c1', { endDate: '2026-01-01T00:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.contract.update).not.toHaveBeenCalled();
    });

    it('allows an update that extends the end date', async () => {
      prisma.contract.findUnique.mockResolvedValue({
        id: 'c1',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
      });
      prisma.contract.update.mockResolvedValue({
        id: 'c1',
        status: 'COMPLETED',
      });
      await expect(
        service.updateContract('c1', {
          endDate: '2027-01-01T00:00:00.000Z',
          status: 'COMPLETED',
        }),
      ).resolves.toEqual({ id: 'c1', status: 'COMPLETED' });
    });
  });
});
