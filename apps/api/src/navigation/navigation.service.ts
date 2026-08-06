import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/pagination';

@Injectable()
export class NavigationService {
  constructor(private prisma: PrismaService) {}

  async getNavigationTimeline(participantId: string) {
    return this.prisma.navigationEvent.findMany({
      ...paginate(),
      where: { participantId },
      orderBy: { date: 'asc' },
    });
  }

  async addNavigationEvent(
    participantId: string,
    eventType: string,
    notes?: string,
  ) {
    return this.prisma.navigationEvent.create({
      data: {
        participantId,
        eventType,
        date: new Date(),
        notes,
      },
    });
  }
}
