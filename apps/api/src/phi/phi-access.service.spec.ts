import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from './phi-access.service';

const OVERSIGHT: PhiActor = { id: 'exec-1', role: 'EXECUTIVE' };
const CLINICIAN: PhiActor = { id: 'clin-1', role: 'CLINICIAN' };

function prismaMock() {
  return {
    participant: { findFirst: jest.fn(), findUnique: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
}

describe('PhiAccessService', () => {
  let service: PhiAccessService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    const module = await Test.createTestingModule({
      providers: [PhiAccessService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PhiAccessService);
  });

  describe('participantScope', () => {
    it('does not restrict oversight roles', () => {
      expect(service.participantScope(OVERSIGHT)).toBeUndefined();
    });

    it('restricts front-line roles to what they registered or are assigned', () => {
      expect(service.participantScope(CLINICIAN)).toEqual({
        OR: [
          { registeredById: 'clin-1' },
          { assignments: { some: { clinicianId: 'clin-1' } } },
        ],
      });
    });

    it('treats an unknown role as scoped rather than unrestricted', () => {
      // Fail closed: a role added to the schema but not to PHI_UNSCOPED_ROLES
      // must not accidentally see every patient.
      expect(service.participantScope({ id: 'x', role: 'NEW_ROLE' })).toBeDefined();
    });
  });

  describe('assertParticipantAccess', () => {
    it('short-circuits for oversight roles without querying', async () => {
      await service.assertParticipantAccess(OVERSIGHT, 'p1', 'test');
      expect(prisma.participant.findFirst).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('is silent for a patient inside the caseload', async () => {
      prisma.participant.findFirst.mockResolvedValue({ id: 'p1' });
      await service.assertParticipantAccess(CLINICIAN, 'p1', 'test');
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    // Break-glass: a clinician must never be blocked from a walk-in, but the
    // access has to be accountable afterwards.
    it('allows a patient outside the caseload and records an override', async () => {
      prisma.participant.findFirst.mockResolvedValue(null);
      prisma.participant.findUnique.mockResolvedValue({ id: 'p2' });

      await expect(
        service.assertParticipantAccess(CLINICIAN, 'p2', 'GET /participants/:id'),
      ).resolves.toBeUndefined();

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      const written = prisma.auditLog.create.mock.calls[0][0].data;
      expect(written.action).toBe('PHI_ACCESS_OVERRIDE');
      expect(written.userId).toBe('clin-1');
      expect(JSON.parse(written.newData)).toEqual({
        participantId: 'p2',
        context: 'GET /participants/:id',
        actorRole: 'CLINICIAN',
      });
    });

    it('404s for an unknown participant instead of logging an override', async () => {
      prisma.participant.findFirst.mockResolvedValue(null);
      prisma.participant.findUnique.mockResolvedValue(null);

      await expect(
        service.assertParticipantAccess(CLINICIAN, 'nope', 'test'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('isUnscoped', () => {
    it.each(['EXECUTIVE', 'SYSTEM_ADMIN', 'ADMIN', 'DATA_OFFICER'])(
      '%s sees everything',
      (role) => expect(service.isUnscoped(role)).toBe(true),
    );

    it.each(['CLINICIAN', 'VOLUNTEER', 'FIELD_OFFICER', 'FINANCE'])(
      '%s does not',
      (role) => expect(service.isUnscoped(role)).toBe(false),
    );
  });
});
