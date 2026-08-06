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
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'p1', ...data })),
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

  describe('registration ids', () => {
    it('assigns one server-side and ignores anything the client sent', async () => {
      await service.create(
        { ...VALID, registrationId: 'GC-HACKED' } as never,
        VOLUNTEER.id,
      );
      expect(prisma.participant.create.mock.calls[0][0].data.registrationId).toMatch(
        /^GC-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/,
      );
    });

    it('takes registeredById from the caller, not the body', async () => {
      await service.create(
        { ...VALID, registeredById: 'someone-else' } as never,
        VOLUNTEER.id,
      );
      expect(prisma.participant.create.mock.calls[0][0].data.registeredById).toBe(
        VOLUNTEER.id,
      );
    });

    // The old client-side scheme used the last six digits of a timestamp, which
    // recycle every ~17 minutes and collided between concurrent field workers.
    it('does not repeat across many registrations', async () => {
      const seen = new Set<string>();
      for (let i = 0; i < 500; i++) {
        seen.add(service['generateRegistrationId']());
      }
      expect(seen.size).toBe(500);
    });

    it('omits characters that are easy to misread by hand', async () => {
      const ids = Array.from({ length: 200 }, () =>
        service['generateRegistrationId']().split('-')[2],
      ).join('');
      expect(ids).not.toMatch(/[ILOU]/);
    });

    it('retries transparently when an id collides', async () => {
      prisma.participant.create
        .mockRejectedValueOnce(uniqueViolation('registrationId'))
        .mockImplementationOnce(({ data }) => ({ id: 'p1', ...data }));

      await expect(service.create({ ...VALID }, VOLUNTEER.id)).resolves.toBeDefined();
      expect(prisma.participant.create).toHaveBeenCalledTimes(2);
    });

    it('reports a duplicate national id as a conflict instead of retrying', async () => {
      prisma.participant.create.mockRejectedValue(uniqueViolation('nationalId'));

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
      expect(prisma.participant.create.mock.calls[0][0].data).toMatchObject({
        address: 'Plot 4',
        lga: 'Barkin Ladi LGA',
        ward: 'Gwol Ward',
        gpsCoordinates: '9.5 N, 8.9 E',
      });
    });
  });

  describe('findAll', () => {
    it('applies the caller scope so a list cannot leak other caseloads', async () => {
      phi.participantScope.mockReturnValue({ OR: [{ registeredById: 'vol-1' }] });
      await service.findAll(VOLUNTEER);
      expect(prisma.participant.findMany.mock.calls[0][0].where).toMatchObject({
        OR: [{ registeredById: 'vol-1' }],
      });
    });

    // Searching must not become a way around the scope.
    it('keeps the scope when a search term is supplied', async () => {
      phi.participantScope.mockReturnValue({ OR: [{ registeredById: 'vol-1' }] });
      await service.findAll(VOLUNTEER, 'grace');
      const where = prisma.participant.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
      expect(where.AND).toBeDefined();
    });

    it('filters in the database rather than in memory', async () => {
      await service.findAll(VOLUNTEER, 'grace');
      const where = prisma.participant.findMany.mock.calls[0][0].where;
      expect(JSON.stringify(where)).toContain('contains');
    });

    it('bounds the result set', async () => {
      await service.findAll(VOLUNTEER);
      expect(prisma.participant.findMany.mock.calls[0][0].take).toBeGreaterThan(0);
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
