import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NavigationService {
  constructor(private prisma: PrismaService) {}

  async getNavigationTimeline(participantId: string) {
    return this.prisma.navigationEvent.findMany({
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
