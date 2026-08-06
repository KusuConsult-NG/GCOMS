import { dataOf } from '../testing/mock-args';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { GrantsService } from './grants.service';

function prismaMock() {
  return {
    grant: {
      findUnique: jest.fn().mockResolvedValue({ id: 'g1' }),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    grantMilestone: {
      findUnique: jest.fn().mockResolvedValue({ id: 'm1' }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
          id: 'm',
          ...data,
        })),
      update: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
          id: 'm1',
          ...data,
        })),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('GrantsService milestones', () => {
  let service: GrantsService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    const module = await Test.createTestingModule({
      providers: [GrantsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(GrantsService);
  });

  it('404s for an unknown grant', async () => {
    prisma.grant.findUnique.mockResolvedValue(null);
    await expect(
      service.createMilestone({
        grantId: 'nope',
        title: 'x',
        dueDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('starts at zero progress and PENDING', async () => {
    await service.createMilestone({
      grantId: 'g1',
      title: 'M',
      dueDate: '2026-01-01',
    });
    expect(
      dataOf<Record<string, unknown>>(prisma.grantMilestone.create, 0),
    ).toMatchObject({
      status: 'PENDING',
      progress: 0,
    });
  });

  // Status and progress disagreeing is what makes a donor report wrong.
  it('completes a milestone when progress reaches 100', async () => {
    await service.updateMilestone('m1', { progress: 100 });
    expect(
      dataOf<Record<string, unknown>>(prisma.grantMilestone.update, 0),
    ).toMatchObject({
      progress: 100,
      status: 'COMPLETED',
    });
  });

  it('sets progress to 100 when marked COMPLETED without a figure', async () => {
    await service.updateMilestone('m1', { status: 'COMPLETED' });
    expect(
      dataOf<Record<string, unknown>>(prisma.grantMilestone.update, 0),
    ).toMatchObject({
      status: 'COMPLETED',
      progress: 100,
    });
  });

  it('respects an explicit status and progress pair', async () => {
    await service.updateMilestone('m1', {
      status: 'IN_PROGRESS',
      progress: 60,
    });
    expect(
      dataOf<Record<string, unknown>>(prisma.grantMilestone.update, 0),
    ).toMatchObject({
      status: 'IN_PROGRESS',
      progress: 60,
    });
  });

  it('does not touch status for an ordinary progress bump', async () => {
    await service.updateMilestone('m1', { progress: 40 });
    expect(
      dataOf<{ status: string }>(prisma.grantMilestone.update, 0).status,
    ).toBeUndefined();
  });

  it('404s when updating or deleting an unknown milestone', async () => {
    prisma.grantMilestone.findUnique.mockResolvedValue(null);
    await expect(service.updateMilestone('ghost', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.deleteMilestone('ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
