import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VolunteersService {
  constructor(private prisma: PrismaService) {}

  async getVolunteers() {
    return this.prisma.user.findMany({
      where: { role: 'VOLUNTEER' },
      include: { volunteerTasks: { include: { outreach: true } } },
    });
  }

  async assignTask(data: {
    outreachId: string;
    volunteerId: string;
    title: string;
  }) {
    return this.prisma.volunteerTask.create({
      data: {
        outreachId: data.outreachId,
        volunteerId: data.volunteerId,
        title: data.title,
        status: 'PENDING',
      },
    });
  }

  async logHours(taskId: string, hours: number) {
    return this.prisma.volunteerTask.update({
      where: { id: taskId },
      data: { hoursLogged: hours, status: 'COMPLETED' },
    });
  }
}
