import { CreateProjectDto } from './dto/create-project.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectTaskDto,
  ListProjectTaskQueryDto,
  UpdateProjectTaskDto,
} from './dto/project-task.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async createProject(data: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        projectName: data.projectName,
        description: data.description,
        budget: data.budget,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managedById: userId,
      },
    });
  }

  async getProjects() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        managedBy: {
          select: { firstName: true, lastName: true },
        },
        // Lets the board show task counts without a request per project, and
        // lets completion be derived rather than invented — the research screen
        // rendered a flat "40% Complete" bar for every project because there was
        // no progress to read.
        _count: { select: { tasks: true } },
        tasks: { select: { status: true } },
      },
    });
  }

  /*
   * Tasks. The ProjectTask table has existed since the first migration and had
   * seeded rows in it, but no endpoint ever read or wrote it — the task board
   * rendered a hardcoded array instead.
   */

  async listTasks(query: ListProjectTaskQueryDto) {
    const where: Prisma.ProjectTaskWhereInput = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;

    return this.prisma.projectTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: { project: { select: { id: true, projectName: true } } },
    });
  }

  async createTask(dto: CreateProjectTaskDto) {
    // Explicit existence check so an unknown projectId is a clear 404 rather
    // than a foreign-key violation surfacing as a generic 400.
    await this.assertProjectExists(dto.projectId);

    return this.prisma.projectTask.create({
      data: {
        projectId: dto.projectId,
        title: dto.title.trim(),
        status: dto.status ?? 'PENDING',
        priority: dto.priority ?? 'MEDIUM',
        description: dto.description?.trim() || null,
        assignee: dto.assignee?.trim() || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: { project: { select: { id: true, projectName: true } } },
    });
  }

  async updateTask(id: string, dto: UpdateProjectTaskDto) {
    await this.assertTaskExists(id);

    // Only fields actually present are written, so a status-only update from the
    // board cannot blank out an assignee or due date.
    const data: Prisma.ProjectTaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;
    if (dto.assignee !== undefined) data.assignee = dto.assignee.trim() || null;
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);

    return this.prisma.projectTask.update({
      where: { id },
      data,
      include: { project: { select: { id: true, projectName: true } } },
    });
  }

  async deleteTask(id: string) {
    await this.assertTaskExists(id);
    await this.prisma.projectTask.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertProjectExists(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
  }

  private async assertTaskExists(id: string) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');
  }
}
