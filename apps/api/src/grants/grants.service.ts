import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGrantMilestoneDto,
  ListGrantMilestoneQueryDto,
  UpdateGrantMilestoneDto,
} from './dto/grant-milestone.dto';
import {
  CreateGrantProposalDto,
  UpdateGrantProposalDto,
} from './dto/grant-proposal.dto';

@Injectable()
export class GrantsService {
  constructor(private prisma: PrismaService) {}

  async createGrant(data: any, userId: string) {
    return this.prisma.grant.create({
      data: {
        donorName: data.donorName,
        grantName: data.grantName,
        amount: parseFloat(data.amount),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managedById: userId,
      },
    });
  }

  async getGrants() {
    return this.prisma.grant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        managedBy: { select: { firstName: true, lastName: true } },
        _count: { select: { milestones: true } },
      },
    });
  }

  /*
   * Milestones. Like ProjectTask, this table shipped in the first migration and
   * carried seeded rows, but nothing could reach it — the milestone tracker
   * rendered a hardcoded array.
   */

  async listMilestones(query: ListGrantMilestoneQueryDto) {
    const where: Prisma.GrantMilestoneWhereInput = {};
    if (query.grantId) where.grantId = query.grantId;
    if (query.status) where.status = query.status;

    return this.prisma.grantMilestone.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        grant: { select: { id: true, grantName: true, donorName: true } },
      },
    });
  }

  async createMilestone(dto: CreateGrantMilestoneDto) {
    await this.assertGrantExists(dto.grantId);

    return this.prisma.grantMilestone.create({
      data: {
        grantId: dto.grantId,
        title: dto.title.trim(),
        dueDate: new Date(dto.dueDate),
        status: dto.status ?? 'PENDING',
        description: dto.description?.trim() || null,
        metric: dto.metric?.trim() || null,
        progress: dto.progress ?? 0,
      },
      include: {
        grant: { select: { id: true, grantName: true, donorName: true } },
      },
    });
  }

  async updateMilestone(id: string, dto: UpdateGrantMilestoneDto) {
    await this.assertMilestoneExists(id);

    const data: Prisma.GrantMilestoneUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;
    if (dto.metric !== undefined) data.metric = dto.metric.trim() || null;
    if (dto.progress !== undefined) data.progress = dto.progress;

    // Keep status and progress consistent: reporting 100% while still "pending"
    // is the kind of drift that makes a donor report wrong.
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'COMPLETED' && dto.progress === undefined) {
        data.progress = 100;
      }
    } else if (dto.progress === 100) {
      data.status = 'COMPLETED';
    }

    return this.prisma.grantMilestone.update({
      where: { id },
      data,
      include: {
        grant: { select: { id: true, grantName: true, donorName: true } },
      },
    });
  }

  async deleteMilestone(id: string) {
    await this.assertMilestoneExists(id);
    await this.prisma.grantMilestone.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertGrantExists(id: string) {
    const grant = await this.prisma.grant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!grant) throw new NotFoundException('Grant not found');
  }

  private async assertMilestoneExists(id: string) {
    const milestone = await this.prisma.grantMilestone.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
  }

  /* GrantProposal had no endpoint; the funding pipeline was a hardcoded array. */

  async listProposals(status?: string) {
    return this.prisma.grantProposal.findMany({
      where: status ? { status } : {},
      orderBy: { submissionDeadline: 'asc' },
    });
  }

  async createProposal(dto: CreateGrantProposalDto) {
    return this.prisma.grantProposal.create({
      data: {
        title: dto.title.trim(),
        donorName: dto.donorName.trim(),
        requestedAmount: dto.requestedAmount,
        submissionDeadline: new Date(dto.submissionDeadline),
        leadAuthor: dto.leadAuthor.trim(),
        status: dto.status ?? 'DRAFT',
      },
    });
  }

  async updateProposal(id: string, dto: UpdateGrantProposalDto) {
    const existing = await this.prisma.grantProposal.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Proposal not found');
    const data: Prisma.GrantProposalUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.donorName !== undefined) data.donorName = dto.donorName.trim();
    if (dto.requestedAmount !== undefined)
      data.requestedAmount = dto.requestedAmount;
    if (dto.submissionDeadline !== undefined)
      data.submissionDeadline = new Date(dto.submissionDeadline);
    if (dto.leadAuthor !== undefined) data.leadAuthor = dto.leadAuthor.trim();
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.grantProposal.update({ where: { id }, data });
  }

  async deleteProposal(id: string) {
    const existing = await this.prisma.grantProposal.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Proposal not found');
    await this.prisma.grantProposal.delete({ where: { id } });
    return { id, deleted: true };
  }
}
