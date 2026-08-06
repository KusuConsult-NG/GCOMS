import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResearchService {
  constructor(private prisma: PrismaService) {}

  async getAllProjects() {
    return this.prisma.researchProject.findMany();
  }

  async createProject(title: string) {
    return this.prisma.researchProject.create({
      data: { title },
    });
  }

  async updateProgress(id: string, progress: number) {
    return this.prisma.researchProject.update({
      where: { id },
      data: { progress },
    });
  }
}
