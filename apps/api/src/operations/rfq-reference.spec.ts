import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OperationsService } from './operations.service';

/**
 * The RFQ reference used to be generated in the browser from a 1000-value
 * random space and posted up. These cover the property that replaced it: the
 * server allocates the reference, in sequence, and a concurrent allocation
 * loses the race rather than the record.
 */
describe('OperationsService — RFQ references', () => {
  let service: OperationsService;
  let prisma: {
    rfq: { findMany: jest.Mock; create: jest.Mock };
  };

  const conflict = () =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });

  beforeEach(async () => {
    prisma = { rfq: { findMany: jest.fn(), create: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [
        OperationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(OperationsService);
  });

  /** The reference the service tried to write on its nth create call. */
  const referenceOn = (call: number): string =>
    (prisma.rfq.create.mock.calls[call][0] as { data: { reference: string } })
      .data.reference;

  it('starts a year at 0001', async () => {
    prisma.rfq.findMany.mockResolvedValue([]);
    prisma.rfq.create.mockResolvedValue({ id: 'r1' });

    await service.createRfq({ description: 'Reagents' });

    expect(referenceOn(0)).toBe(`RFQ-${new Date().getFullYear()}-0001`);
  });

  it('continues from the highest existing reference', async () => {
    const year = new Date().getFullYear();
    prisma.rfq.findMany.mockResolvedValue([{ reference: `RFQ-${year}-0041` }]);
    prisma.rfq.create.mockResolvedValue({ id: 'r1' });

    await service.createRfq({ description: 'Reagents' });

    expect(referenceOn(0)).toBe(`RFQ-${year}-0042`);
  });

  it('pads past four digits without truncating', async () => {
    const year = new Date().getFullYear();
    prisma.rfq.findMany.mockResolvedValue([{ reference: `RFQ-${year}-9999` }]);
    prisma.rfq.create.mockResolvedValue({ id: 'r1' });

    await service.createRfq({ description: 'Reagents' });

    expect(referenceOn(0)).toBe(`RFQ-${year}-10000`);
  });

  it('scopes the sequence to the current year', async () => {
    prisma.rfq.findMany.mockResolvedValue([]);
    prisma.rfq.create.mockResolvedValue({ id: 'r1' });

    await service.createRfq({ description: 'Reagents' });

    const where = prisma.rfq.findMany.mock.calls[0][0] as {
      where: { reference: { startsWith: string } };
    };
    expect(where.where.reference.startsWith).toBe(
      `RFQ-${new Date().getFullYear()}-`,
    );
  });

  it('retries on a unique-constraint clash and succeeds', async () => {
    const year = new Date().getFullYear();
    prisma.rfq.findMany.mockResolvedValue([{ reference: `RFQ-${year}-0007` }]);
    prisma.rfq.create
      .mockRejectedValueOnce(conflict())
      .mockResolvedValueOnce({ id: 'r1' });

    await expect(service.createRfq({ description: 'Reagents' })).resolves.toEqual(
      { id: 'r1' },
    );

    // The retry advances by the attempt number rather than re-deriving the
    // reference it just collided with.
    expect(referenceOn(0)).toBe(`RFQ-${year}-0008`);
    expect(referenceOn(1)).toBe(`RFQ-${year}-0009`);
  });

  it('gives up after repeated clashes rather than looping', async () => {
    prisma.rfq.findMany.mockResolvedValue([]);
    prisma.rfq.create.mockRejectedValue(conflict());

    await expect(service.createRfq({ description: 'Reagents' })).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.rfq.create).toHaveBeenCalledTimes(5);
  });

  it('does not swallow an unrelated database error', async () => {
    prisma.rfq.findMany.mockResolvedValue([]);
    prisma.rfq.create.mockRejectedValue(new Error('connection lost'));

    await expect(service.createRfq({ description: 'Reagents' })).rejects.toThrow(
      'connection lost',
    );
    expect(prisma.rfq.create).toHaveBeenCalledTimes(1);
  });

  it('ignores a client-supplied reference entirely', async () => {
    prisma.rfq.findMany.mockResolvedValue([]);
    prisma.rfq.create.mockResolvedValue({ id: 'r1' });

    await service.createRfq({
      description: 'Reagents',
      reference: 'RFQ-1999-0001',
    } as never);

    expect(referenceOn(0)).toBe(`RFQ-${new Date().getFullYear()}-0001`);
  });
});
