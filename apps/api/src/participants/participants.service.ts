import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Participant } from '@prisma/client';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';

@Injectable()
export class ParticipantsService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  async create(data: Prisma.ParticipantCreateInput): Promise<Participant> {
    try {
      return await this.prisma.participant.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Participant with this National ID already exists',
        );
      }
      throw error;
    }
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
  async findAll(actor: PhiActor, search?: string): Promise<Participant[]> {
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
