import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateBoardResolutionDto,
  UpdateBoardResolutionDto,
} from './dto/board-resolution.dto';

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
      },
    });
  }

  async getMeetings() {
    return this.prisma.governanceMeeting.findMany({
      orderBy: { meetingDate: 'desc' },
      include: {
        organizedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  /* BoardResolution had no endpoint; the board screen used a hardcoded array. */

  async listResolutions(status?: string) {
    return this.prisma.boardResolution.findMany({
      where: status ? { status } : {},
      orderBy: { passedDate: 'desc' },
    });
  }

  async createResolution(dto: CreateBoardResolutionDto) {
    const clash = await this.prisma.boardResolution.findUnique({
      where: { resolutionNo: dto.resolutionNo.trim() },
      select: { id: true },
    });
    if (clash)
      throw new ConflictException('That resolution number already exists');

    return this.prisma.boardResolution.create({
      data: {
        resolutionNo: dto.resolutionNo.trim(),
        title: dto.title.trim(),
        description: dto.description.trim(),
        votesFor: dto.votesFor ?? 0,
        votesAgainst: dto.votesAgainst ?? 0,
        abstentions: dto.abstentions ?? 0,
        // Derived from the vote unless stated: a resolution's outcome should not
        // be able to contradict its own tally.
        status:
          dto.status ??
          ((dto.votesFor ?? 0) > (dto.votesAgainst ?? 0)
            ? 'PASSED'
            : 'PENDING'),
        passedDate: dto.passedDate ? new Date(dto.passedDate) : new Date(),
      },
    });
  }

  async updateResolution(id: string, dto: UpdateBoardResolutionDto) {
    const existing = await this.prisma.boardResolution.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Resolution not found');
    const data: Prisma.BoardResolutionUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description.trim();
    if (dto.votesFor !== undefined) data.votesFor = dto.votesFor;
    if (dto.votesAgainst !== undefined) data.votesAgainst = dto.votesAgainst;
    if (dto.abstentions !== undefined) data.abstentions = dto.abstentions;
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.boardResolution.update({ where: { id }, data });
  }
}
