import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { HrService } from './hr.service';
import type { AuthUser } from '../auth/authenticated-request';
import type { CreateStaffRecordDto } from './dto/create-staff-record.dto';

/**
 * POST /hr creates a user account as well as a staff record, which made it a
 * second route to account creation that did not carry the rules the first one
 * enforces. It took the role off an untyped body with no check that the caller
 * may grant it — and HR is not a grantor — and hashed the literal 'password123'
 * for every account. These cover both.
 */
describe('HrService.createStaffRecord', () => {
  let service: HrService;
  let prisma: {
    $transaction: jest.Mock;
    user: { findUnique: jest.Mock; create: jest.Mock };
    staffRecord: { create: jest.Mock };
  };

  const HR: AuthUser = { id: 'hr-1', email: 'hr@x', role: 'HR' };
  const EXECUTIVE: AuthUser = { id: 'ex-1', email: 'ex@x', role: 'EXECUTIVE' };

  const dto = (
    over: Partial<CreateStaffRecordDto> = {},
  ): CreateStaffRecordDto => ({
    email: 'New.Hire@Example.COM',
    password: 'a-long-enough-password',
    firstName: 'New',
    lastName: 'Hire',
    role: 'VOLUNTEER',
    department: 'Outreach',
    employmentType: 'FULL_TIME',
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'u-1' }),
      },
      staffRecord: { create: jest.fn().mockResolvedValue({ id: 's-1' }) },
      $transaction: jest.fn(),
    };
    // Run the callback against the same mock, as Prisma does.
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    const module = await Test.createTestingModule({
      providers: [HrService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(HrService);
  });

  const createdUser = () =>
    (prisma.user.create.mock.calls as unknown[][])[0][0] as {
      data: { email: string; password: string; role: string };
    };

  it('refuses to let a non-grantor assign a privileged role', async () => {
    await expect(
      service.createStaffRecord(dto({ role: 'SYSTEM_ADMIN' }), HR),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it.each(['EXECUTIVE', 'SYSTEM_ADMIN', 'ADMIN'] as const)(
    'refuses %s specifically, when requested by HR',
    async (role) => {
      await expect(
        service.createStaffRecord(dto({ role }), HR),
      ).rejects.toThrow(ForbiddenException);
    },
  );

  it('allows a grantor to assign a privileged role', async () => {
    await service.createStaffRecord(dto({ role: 'ADMIN' }), EXECUTIVE);
    expect(createdUser().data.role).toBe('ADMIN');
  });

  it('allows HR to onboard an ordinary role', async () => {
    await service.createStaffRecord(dto({ role: 'VOLUNTEER' }), HR);
    expect(createdUser().data.role).toBe('VOLUNTEER');
  });

  it('hashes the supplied password, never a hardcoded one', async () => {
    await service.createStaffRecord(
      dto({ password: 'a-long-enough-password' }),
      HR,
    );

    const { password } = createdUser().data;
    expect(password).not.toBe('a-long-enough-password');
    expect(await bcrypt.compare('a-long-enough-password', password)).toBe(true);
    // The value this route used to hash for every account it created.
    expect(await bcrypt.compare('password123', password)).toBe(false);
  });

  it('hashes at the same cost as the users module', async () => {
    await service.createStaffRecord(dto(), HR);
    // bcrypt encodes the cost in the hash: $2b$12$...
    expect(createdUser().data.password).toMatch(/^\$2[aby]\$12\$/);
  });

  it('normalises the email, so case cannot create a duplicate account', async () => {
    await service.createStaffRecord(dto({ email: 'New.Hire@Example.COM' }), HR);
    expect(createdUser().data.email).toBe('new.hire@example.com');
    const lookup = (prisma.user.findUnique.mock.calls as unknown[][])[0][0] as {
      where: { email: string };
    };
    expect(lookup.where.email).toBe('new.hire@example.com');
  });

  it('refuses an email that already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.createStaffRecord(dto(), HR)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('records the acting manager on the staff record', async () => {
    await service.createStaffRecord(dto(), HR);
    const record = (
      prisma.staffRecord.create.mock.calls as unknown[][]
    )[0][0] as {
      data: { managedById: string; userId: string };
    };
    expect(record.data.managedById).toBe(HR.id);
    expect(record.data.userId).toBe('u-1');
  });
});
