import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Participant } from '@prisma/client';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { PaginationQueryDto, paginate } from '../common/pagination';

/**
 * Crockford-style base32, minus I/L/O/U so a handwritten ID cannot be misread in
 * the field. 32 divides 256 exactly, so byte-modulo introduces no bias.
 */
const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ID_LENGTH = 6;
const MAX_ID_ATTEMPTS = 5;

@Injectable()
export class ParticipantsService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  /** e.g. GC-2608-A7K3M9 — year, month, then random. */
  private generateRegistrationId(): string {
    const now = new Date();
    const period = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const bytes = randomBytes(ID_LENGTH);
    let code = '';
    for (let i = 0; i < ID_LENGTH; i++) {
      code += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
    }
    return `GC-${period}-${code}`;
  }

  /**
   * The record a previous attempt with this key created, if the caller is the
   * one who created it.
   *
   * The ownership check is the point. Keys are UUIDs and a client only ever
   * sees its own, but the lookup is by key alone, so without this a caller who
   * guessed or replayed someone else's key would be handed that patient's full
   * record — a read of PHI the caller has no claim to, through a write route.
   */
  private async findByIdempotencyKey(
    idempotencyKey: string,
    registeredById: string,
  ): Promise<Participant | null> {
    const existing = await this.prisma.participant.findUnique({
      where: { idempotencyKey },
    });
    if (!existing) return null;
    if (existing.registeredById !== registeredById) {
      throw new ConflictException(
        'This registration key has already been used.',
      );
    }
    return existing;
  }

  /**
   * Registers a participant and assigns the registration ID server-side.
   *
   * The ID used to be generated in the browser from a truncated timestamp, which
   * collided and occupied the nationalId column. Collisions are now impossible
   * to observe: a duplicate id is retried transparently, and a duplicate
   * national ID is reported as the conflict it is.
   */
  async create(
    dto: CreateParticipantDto,
    registeredById: string,
  ): Promise<Participant> {
    if (!dto.consentGiven) {
      throw new BadRequestException(
        'Participant consent is required before registration.',
      );
    }

    // A replay of a registration this caller already made returns what the
    // first attempt created. Checked before the insert for the ordinary case,
    // and again on P2002 below for two replays racing each other.
    if (dto.idempotencyKey) {
      const existing = await this.findByIdempotencyKey(
        dto.idempotencyKey,
        registeredById,
      );
      if (existing) return existing;
    }

    const nationalId = dto.nationalId?.trim() || null;

    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.participant.create({
          data: {
            registrationId: this.generateRegistrationId(),
            nationalId,
            idempotencyKey: dto.idempotencyKey || null,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            dateOfBirth: new Date(dto.dateOfBirth),
            gender: dto.gender,
            phoneNumber: dto.phoneNumber?.trim() || null,
            address: dto.address?.trim() || null,
            lga: dto.lga?.trim() || null,
            ward: dto.ward?.trim() || null,
            gpsCoordinates: dto.gpsCoordinates?.trim() || null,
            communityId: dto.communityId || null,
            consentGiven: true,
            registeredById,
          },
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        ) {
          throw error;
        }
        // meta.target is string | string[] depending on the driver, so
        // String() on the array form yields a comma-joined list and on an
        // object form would yield "[object Object]".
        const rawTarget = error.meta?.target;
        const target = Array.isArray(rawTarget)
          ? rawTarget.join(',')
          : typeof rawTarget === 'string'
            ? rawTarget
            : '';
        if (target.includes('nationalId')) {
          throw new ConflictException(
            'A participant with this National ID already exists',
          );
        }
        if (target.includes('idempotencyKey') && dto.idempotencyKey) {
          // Two replays of the same capture arrived together and the other one
          // won. Its record is the answer to both.
          const existing = await this.findByIdempotencyKey(
            dto.idempotencyKey,
            registeredById,
          );
          if (existing) return existing;
          throw new ConflictException(
            'This registration key has already been used.',
          );
        }
        // Registration ID collision — draw another and retry.
      }
    }

    throw new InternalServerErrorException(
      'Could not allocate a unique registration ID. Please retry.',
    );
  }

  /**
   * Both the listing and the search run through the caller's scope, so a
   * front-line account cannot enumerate the patient index by searching.
   *
   * The filter is applied in the database rather than in memory (the previous
   * implementation loaded every participant and filtered in JS). `contains` is
   * case-insensitive on SQLite; a move to Postgres will need
   * `mode: 'insensitive'` here to preserve that.
   */
  async findAll(
    actor: PhiActor,
    search?: string,
    pagination?: PaginationQueryDto,
  ): Promise<Participant[]> {
    const where: Prisma.ParticipantWhereInput = {
      ...this.phi.participantScope(actor),
    };

    const query = search?.trim();
    if (query) {
      where.AND = [
        {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { nationalId: { contains: query } },
            { phoneNumber: { contains: query } },
          ],
        },
      ];
    }

    return this.prisma.participant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...paginate(pagination),
    });
  }

  async findOne(id: string, actor: PhiActor): Promise<Participant | null> {
    // Throws 404 for an unknown id; logs PHI_ACCESS_OVERRIDE when the caller
    // reaches outside their own caseload.
    await this.phi.assertParticipantAccess(actor, id, 'GET /participants/:id');

    const p = await this.prisma.participant.findUnique({
      where: { id },
      include: {
        screenings: { orderBy: { createdAt: 'desc' } },
        referrals: {
          include: {
            referredBy: { select: { firstName: true, lastName: true } },
          },
        },
        navigationEvents: { orderBy: { date: 'asc' } },
        clinicalEncounters: {
          orderBy: { createdAt: 'desc' },
          include: {
            clinician: { select: { firstName: true, lastName: true } },
          },
        },
        followUps: { orderBy: { scheduledDate: 'asc' } },
        assignments: {
          include: {
            clinician: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Participant not found');
    return p;
  }
}
