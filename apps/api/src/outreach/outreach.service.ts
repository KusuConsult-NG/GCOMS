import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/pagination';

@Injectable()
export class OutreachService {
  constructor(private prisma: PrismaService) {}

  async getAllOutreaches() {
    return this.prisma.outreach.findMany({
      ...paginate(),
      include: {
        location: true,
        tasks: {
          include: {
            volunteer: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getOutreach(id: string) {
    const outreach = await this.prisma.outreach.findUnique({
      where: { id },
      include: {
        location: true,
        tasks: {
          include: {
            volunteer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!outreach) throw new NotFoundException('Outreach not found');
    return outreach;
  }

  async createOutreach(data: {
    title: string;
    locationId?: string;
    date: string;
    description?: string;
  }) {
    // If no locationId provided, find or create a default location
    let locationId = data.locationId;
    if (!locationId) {
      const defaultLocation = await this.prisma.location.findFirst();
      if (defaultLocation) {
        locationId = defaultLocation.id;
      } else {
        const newLocation = await this.prisma.location.create({
          data: {
            name: 'Main Office',
            lga: 'Jos North',
            state: 'Plateau State',
          },
        });
        locationId = newLocation.id;
      }
    }

    return this.prisma.outreach.create({
      data: {
        title: data.title,
        locationId,
        date: new Date(data.date),
        status: 'PLANNED',
      },
      include: { location: true },
    });
  }

  async assignVolunteerTask(
    outreachId: string,
    volunteerId: string,
    title: string,
  ) {
    return this.prisma.volunteerTask.create({
      data: { title, outreachId, volunteerId },
    });
  }

  async logVolunteerHours(taskId: string, hours: number) {
    return this.prisma.volunteerTask.update({
      where: { id: taskId },
      data: { hoursLogged: hours, status: 'COMPLETED' },
    });
  }
}
