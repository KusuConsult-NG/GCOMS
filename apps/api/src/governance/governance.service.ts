import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GovernanceService {
  constructor(private prisma: PrismaService) {}

  async scheduleMeeting(data: any, userId: string) {
    return this.prisma.governanceMeeting.create({
      data: {
        title: data.title,
        meetingDate: new Date(data.meetingDate),
        minutesUrl: data.minutesUrl,
        organizedById: userId,
      }
    });
  }

  async getMeetings() {
    return this.prisma.governanceMeeting.findMany({
      orderBy: { meetingDate: 'desc' },
      include: {
        organizedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });
  }
}
