import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Participant } from '@prisma/client';

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ParticipantCreateInput): Promise<Participant> {
    try {
      return await this.prisma.participant.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Participant with this National ID already exists');
      }
      throw error;
    }
  }

  async findAll(search?: string): Promise<Participant[]> {
    if (search) {
      const query = search.toLowerCase();
      const all = await this.prisma.participant.findMany({ orderBy: { createdAt: 'desc' } });
      return all.filter(p =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.nationalId.toLowerCase().includes(query) ||
        (p.phoneNumber && p.phoneNumber.toLowerCase().includes(query))
      );
    }
    return this.prisma.participant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Participant | null> {
    const p = await this.prisma.participant.findUnique({
      where: { id },
      include: {
        screenings: { orderBy: { createdAt: 'desc' } },
        referrals: { include: { referredBy: { select: { firstName: true, lastName: true } } } },
        navigationEvents: { orderBy: { date: 'asc' } },
        clinicalEncounters: {
          orderBy: { createdAt: 'desc' },
          include: { clinician: { select: { firstName: true, lastName: true } } },
        },
        followUps: { orderBy: { scheduledDate: 'asc' } },
        assignments: { include: { clinician: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!p) throw new NotFoundException('Participant not found');
    return p;
  }
}
