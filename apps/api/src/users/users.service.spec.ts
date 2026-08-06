import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

function prismaMock() {
  const tx = {
    user: { update: jest.fn().mockResolvedValue({ id: 'u1' }) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
  return {
    tx,
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) => ({ id: 'new', ...data })),
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
  };
}

const EXEC = { id: 'exec-1', role: 'EXECUTIVE' };
const HR = { id: 'hr-1', role: 'HR' };

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(UsersService);
  });

  const newUser = {
    email: 'New.Person@GCOMS.org',
    password: 'a-long-enough-password',
    firstName: ' Ada ',
    lastName: ' Nwosu ',
  };

  describe('createUser', () => {
    beforeEach(() => prisma.user.findUnique.mockResolvedValue(null));

    it('normalises the email and trims names', async () => {
      await service.createUser({ ...newUser, role: 'CLINICIAN' }, 'EXECUTIVE');
      expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({
        email: 'new.person@gcoms.org',
        firstName: 'Ada',
        lastName: 'Nwosu',
        role: 'CLINICIAN',
      });
    });

    it('hashes the password rather than storing it', async () => {
      await service.createUser({ ...newUser }, 'EXECUTIVE');
      const stored = prisma.user.create.mock.calls[0][0].data.password;
      expect(stored).not.toBe(newUser.password);
      await expect(bcrypt.compare(newUser.password, stored)).resolves.toBe(true);
    });

    it('falls back to the default role when none is given', async () => {
      await service.createUser({ ...newUser }, 'EXECUTIVE');
      expect(prisma.user.create.mock.calls[0][0].data.role).toBe(
        'COMMUNITY_HEALTH_WORKER',
      );
    });

    // This is the escalation path that made self-registration dangerous: HR
    // legitimately onboards staff, so it must not also be able to mint admins.
    it.each(['SYSTEM_ADMIN', 'EXECUTIVE', 'ADMIN'])(
      'refuses to let HR create a %s',
      async (role) => {
        await expect(
          service.createUser({ ...newUser, role: role as never }, HR.role),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(prisma.user.create).not.toHaveBeenCalled();
      },
    );

    it('lets HR create an ordinary clinical account', async () => {
      await expect(
        service.createUser({ ...newUser, role: 'CLINICIAN' }, HR.role),
      ).resolves.toBeDefined();
    });

    it('lets an executive create a system admin', async () => {
      await expect(
        service.createUser({ ...newUser, role: 'SYSTEM_ADMIN' }, EXEC.role),
      ).resolves.toBeDefined();
    });

    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.createUser({ ...newUser }, EXEC.role)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('updateRole', () => {
    beforeEach(() =>
      prisma.user.findUnique.mockResolvedValue({
        id: 'target',
        email: 't@gcoms.org',
        role: 'VOLUNTEER',
      }),
    );

    it('rejects a non-grantor even if it reaches the service', async () => {
      await expect(
        service.updateRole('target', { role: 'CLINICIAN' }, HR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Guarantees at least one grantor always survives: an actor can demote every
    // other administrator but never the account they are signed in as.
    it('refuses to let an actor change their own role', async () => {
      await expect(
        service.updateRole(EXEC.id, { role: 'VOLUNTEER' }, EXEC),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('404s for an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateRole('ghost', { role: 'CLINICIAN' }, EXEC),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('writes the change and its audit record together', async () => {
      await service.updateRole('target', { role: 'CLINICIAN' }, EXEC);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.tx.user.update).toHaveBeenCalled();
      const audit = prisma.tx.auditLog.create.mock.calls[0][0].data;
      expect(audit.action).toBe('USER_ROLE_CHANGED');
      expect(audit.userId).toBe(EXEC.id);
      expect(JSON.parse(audit.oldData).role).toBe('VOLUNTEER');
      expect(JSON.parse(audit.newData).role).toBe('CLINICIAN');
    });

    it('does not audit a no-op', async () => {
      await service.updateRole('target', { role: 'VOLUNTEER' }, EXEC);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    beforeEach(() =>
      prisma.user.findUnique.mockResolvedValue({
        id: 'target',
        email: 't@gcoms.org',
        isActive: true,
      }),
    );

    it('refuses self-deactivation so the org cannot lock itself out', async () => {
      await expect(
        service.updateStatus(EXEC.id, { isActive: false }, EXEC),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a non-grantor', async () => {
      await expect(
        service.updateStatus('target', { isActive: false }, HR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('audits a real change', async () => {
      await service.updateStatus('target', { isActive: false }, EXEC);
      const audit = prisma.tx.auditLog.create.mock.calls[0][0].data;
      expect(audit.action).toBe('USER_STATUS_CHANGED');
      expect(JSON.parse(audit.newData).isActive).toBe(false);
    });

    it('does not audit a no-op', async () => {
      await service.updateStatus('target', { isActive: true }, EXEC);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
