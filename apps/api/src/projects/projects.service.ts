import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/pagination';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async createProject(data: any, userId: string) {
    return this.prisma.project.create({
      data: {
        projectName: data.projectName,
        description: data.description,
        budget: parseFloat(data.budget),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managedById: userId,
      },
    });
  }

  async getProjects() {
    return this.prisma.project.findMany({
      ...paginate(),
      orderBy: { createdAt: 'desc' },
      include: {
        managedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }
}
