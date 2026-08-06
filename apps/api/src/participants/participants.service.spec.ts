import { callArg, dataOf } from '../testing/mock-args';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService } from '../phi/phi-access.service';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';

const VOLUNTEER = { id: 'vol-1', role: 'VOLUNTEER' };

function uniqueViolation(target: string) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target: [target] },
  });
}

const VALID: CreateParticipantDto = {
  firstName: 'Ladi',
  lastName: 'Musa',
  dateOfBirth: '1985-04-12',
  gender: 'Female',
  consentGiven: true,
};

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let prisma: { participant: Record<string, jest.Mock> };
  let phi: { participantScope: jest.Mock; assertParticipantAccess: jest.Mock };

  beforeEach(async () => {
    prisma = {
      participant: {
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: Record<string, unknown> }) => ({
              id: 'p1',
              ...data,
            }),
          ),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    };
    phi = {
      participantScope: jest.fn().mockReturnValue(undefined),
      assertParticipantAccess: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PhiAccessService, useValue: phi },
      ],
    }).compile();
    service = module.get(ParticipantsService);
  });

  describe('idempotency key', () => {
    const KEY = '3f1c2a54-9d7b-4e21-8f66-1a2b3c4d5e6f';

    it('returns the first record rather than registering the patient twice', async () => {
      const first = {
        id: 'p1',
        registrationId: 'GC-2608-ABC123',
        registeredById: VOLUNTEER.id,
      };
      prisma.participant.findUnique.mockResolvedValueOnce(first);

      const result = await service.create(
        { ...VALID, idempotencyKey: KEY },
        VOLUNTEER.id,
      );

      expect(result).toBe(first);
      expect(prisma.participant.create).not.toHaveBeenCalled();
    });

    it('stores the key on the record it creates', async () => {
      prisma.participant.findUnique.mockResolvedValueOnce(null);
      await service.create({ ...VALID, idempotencyKey: KEY }, VOLUNTEER.id);
      expect(
        dataOf<{ idempotencyKey: string }>(prisma.participant.create, 0)
          .idempotencyKey,
      ).toBe(KEY);
    });

    // Keys are UUIDs and a client only ever sees its own, but the lookup is by
    // key alone: without the ownership check this hands back another patient's
    // full record through a write route.
    it('refuses a key belonging to a different registrant', async () => {
      prisma.participant.findUnique.mockResolvedValueOnce({
        id: 'p9',
        registeredById: 'another-volunteer',
      });

      await expect(
        service.create({ ...VALID, idempotencyKey: KEY }, VOLUNTEER.id),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.participant.create).not.toHaveBeenCalled();
    });

    it('resolves two replays racing each other to the same record', async () => {
      const winner = { id: 'p1', registeredById: VOLUNTEER.id };
      // Nothing on the pre-check, then the other replay commits first.
      prisma.participant.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(winner);
      prisma.participant.create.mockRejectedValueOnce(
        uniqueViolation('idempotencyKey'),
      );

      const result = await service.create(
        { ...VALID, idempotencyKey: KEY },
        VOLUNTEER.id,
      );

      expect(result).toBe(winner);
    });

    it('leaves the column null when no key is sent', async () => {
      await service.create(VALID, VOLUNTEER.id);
      expect(
        dataOf<{ idempotencyKey: string | null }>(prisma.participant.create, 0)
          .idempotencyKey,
      ).toBeNull();
      expect(prisma.participant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('registration ids', () => {
    it('assigns one server-side and ignores anything the client sent', async () => {
      await service.create(
        { ...VALID, registrationId: 'GC-HACKED' } as never,
        VOLUNTEER.id,
      );
      expect(
        dataOf<{ registrationId: string }>(prisma.participant.create, 0)
          .registrationId,
      ).toMatch(/^GC-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/);
    });

    it('takes registeredById from the caller, not the body', async () => {
      await service.create(
        { ...VALID, registeredById: 'someone-else' } as never,
        VOLUNTEER.id,
      );
      expect(
        dataOf<{ registeredById: string }>(prisma.participant.create, 0)
          .registeredById,
      ).toBe(VOLUNTEER.id);
    });

    // The old client-side scheme used the last six digits of a timestamp, which
    // recycle every ~17 minutes and collided between concurrent field workers.
    it('does not repeat across many registrations', () => {
      const seen = new Set<string>();
      for (let i = 0; i < 500; i++) {
        seen.add(service['generateRegistrationId']());
      }
      expect(seen.size).toBe(500);
    });

    it('omits characters that are easy to misread by hand', () => {
      const ids = Array.from(
        { length: 200 },
        () => service['generateRegistrationId']().split('-')[2],
      ).join('');
      expect(ids).not.toMatch(/[ILOU]/);
    });

    it('retries transparently when an id collides', async () => {
      prisma.participant.create
        .mockRejectedValueOnce(uniqueViolation('registrationId'))
        .mockImplementationOnce(
          ({ data }: { data: Record<string, unknown> }) => ({
            id: 'p1',
            ...data,
          }),
        );

      await expect(
        service.create({ ...VALID }, VOLUNTEER.id),
      ).resolves.toBeDefined();
      expect(prisma.participant.create).toHaveBeenCalledTimes(2);
    });

    it('reports a duplicate national id as a conflict instead of retrying', async () => {
      prisma.participant.create.mockRejectedValue(
        uniqueViolation('nationalId'),
      );

      await expect(
        service.create({ ...VALID, nationalId: 'NIN-1' }, VOLUNTEER.id),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.participant.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('consent', () => {
    // The column defaults to true, so consent was previously recorded as given
    // whether or not it ever was.
    it('refuses to register without it', async () => {
      await expect(
        service.create({ ...VALID, consentGiven: false }, VOLUNTEER.id),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.participant.create).not.toHaveBeenCalled();
    });
  });

  describe('structured location', () => {
    it('stores lga, ward and gps as fields rather than folding them into address', async () => {
      await service.create(
        {
          ...VALID,
          address: 'Plot 4',
          lga: 'Barkin Ladi LGA',
          ward: 'Gwol Ward',
          gpsCoordinates: '9.5 N, 8.9 E',
        },
        VOLUNTEER.id,
      );
      expect(
        dataOf<Record<string, unknown>>(prisma.participant.create, 0),
      ).toMatchObject({
        address: 'Plot 4',
        lga: 'Barkin Ladi LGA',
        ward: 'Gwol Ward',
        gpsCoordinates: '9.5 N, 8.9 E',
      });
    });
  });

  describe('findAll', () => {
    it('applies the caller scope so a list cannot leak other caseloads', async () => {
      phi.participantScope.mockReturnValue({
        OR: [{ registeredById: 'vol-1' }],
      });
      await service.findAll(VOLUNTEER);
      expect(
        callArg<Record<string, unknown>>(prisma.participant.findMany, 0).where,
      ).toMatchObject({
        OR: [{ registeredById: 'vol-1' }],
      });
    });

    // Searching must not become a way around the scope.
    it('keeps the scope when a search term is supplied', async () => {
      phi.participantScope.mockReturnValue({
        OR: [{ registeredById: 'vol-1' }],
      });
      await service.findAll(VOLUNTEER, 'grace');
      const where = callArg<{ where: Record<string, unknown> }>(
        prisma.participant.findMany,
        0,
      ).where;
      expect(where.OR).toBeDefined();
      expect(where.AND).toBeDefined();
    });

    it('filters in the database rather than in memory', async () => {
      await service.findAll(VOLUNTEER, 'grace');
      const where = callArg<{ where: Record<string, unknown> }>(
        prisma.participant.findMany,
        0,
      ).where;
      expect(JSON.stringify(where)).toContain('contains');
    });

    it('bounds the result set', async () => {
      await service.findAll(VOLUNTEER);
      expect(
        callArg<{ take: number }>(prisma.participant.findMany, 0).take,
      ).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('checks access before returning the record', async () => {
      prisma.participant.findUnique.mockResolvedValue({ id: 'p1' });
      await service.findOne('p1', VOLUNTEER);
      expect(phi.assertParticipantAccess).toHaveBeenCalledWith(
        VOLUNTEER,
        'p1',
        expect.any(String),
      );
    });
  });
});
