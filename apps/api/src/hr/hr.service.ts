import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  CreateAppraisalDto,
  UpdateAppraisalDto,
  CreateOnboardingDto,
  UpdateOnboardingDto,
} from './dto/hr-records.dto';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async createStaffRecord(data: any, hrManagerId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create the user account with a default password (e.g., 'password123')
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role, // Admin assigns role during onboarding
        },
      });

      // 2. Create the StaffRecord linked to the new user
      const staffRecord = await prisma.staffRecord.create({
        data: {
          userId: user.id,
          department: data.department,
          employmentType: data.employmentType,
          status: 'ACTIVE',
          managedById: hrManagerId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return staffRecord;
    });
  }

  async getStaffRecords() {
    return this.prisma.staffRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        managedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  /*
   * LeaveRequest, Appraisal and OnboardingChecklist all existed as tables with
   * no endpoint. The HR screens rendered hardcoded arrays instead.
   *
   * employeeId has no foreign key in the schema, so existence is enforced here
   * rather than by the database. Adding real relations is the better fix and is
   * left as a follow-up.
   */

  private async assertUserExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Employee not found');
  }

  async listLeave(query: { employeeId?: string; status?: string }) {
    const where: Prisma.LeaveRequestWhereInput = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    return this.prisma.leaveRequest.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
  }

  async createLeave(dto: CreateLeaveRequestDto) {
    await this.assertUserExists(dto.employeeId);
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate cannot be before startDate');
    }
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        type: dto.type ?? 'ANNUAL',
        reason: dto.reason?.trim() || null,
      },
    });
  }

  async updateLeave(id: string, dto: UpdateLeaveRequestDto) {
    const existing = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Leave request not found');

    const start = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    if (end < start)
      throw new BadRequestException('endDate cannot be before startDate');

    const data: Prisma.LeaveRequestUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.startDate !== undefined) data.startDate = start;
    if (dto.endDate !== undefined) data.endDate = end;
    return this.prisma.leaveRequest.update({ where: { id }, data });
  }

  async deleteLeave(id: string) {
    const existing = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Leave request not found');
    await this.prisma.leaveRequest.delete({ where: { id } });
    return { id, deleted: true };
  }

  async listAppraisals(employeeId?: string) {
    return this.prisma.appraisal.findMany({
      where: employeeId ? { employeeId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAppraisal(dto: CreateAppraisalDto, reviewerId: string) {
    await this.assertUserExists(dto.employeeId);
    if (dto.employeeId === reviewerId) {
      throw new BadRequestException('An employee cannot appraise themselves');
    }
    return this.prisma.appraisal.create({
      data: {
        employeeId: dto.employeeId,
        reviewerId,
        period: dto.period.trim(),
        score: dto.score,
        comments: dto.comments?.trim() || null,
      },
    });
  }

  async updateAppraisal(id: string, dto: UpdateAppraisalDto) {
    const existing = await this.prisma.appraisal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Appraisal not found');
    const data: Prisma.AppraisalUpdateInput = {};
    if (dto.score !== undefined) data.score = dto.score;
    if (dto.period !== undefined) data.period = dto.period.trim();
    if (dto.comments !== undefined) data.comments = dto.comments.trim() || null;
    return this.prisma.appraisal.update({ where: { id }, data });
  }

  async listOnboarding() {
    return this.prisma.onboardingChecklist.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOnboarding(dto: CreateOnboardingDto) {
    return this.prisma.onboardingChecklist.create({
      data: {
        employeeName: dto.employeeName.trim(),
        role: dto.role.trim(),
        identityVerified: dto.identityVerified ?? false,
        contractSigned: dto.contractSigned ?? false,
        itProvisioned: dto.itProvisioned ?? false,
        medicalCleared: dto.medicalCleared ?? false,
        status: 'IN_PROGRESS',
      },
    });
  }

  async updateOnboarding(id: string, dto: UpdateOnboardingDto) {
    const existing = await this.prisma.onboardingChecklist.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Onboarding record not found');

    const merged = {
      identityVerified: dto.identityVerified ?? existing.identityVerified,
      contractSigned: dto.contractSigned ?? existing.contractSigned,
      itProvisioned: dto.itProvisioned ?? existing.itProvisioned,
      medicalCleared: dto.medicalCleared ?? existing.medicalCleared,
    };
    // Status is derived, never sent by the client, so it cannot drift from the
    // checkboxes it is meant to summarise.
    const status = Object.values(merged).every(Boolean)
      ? 'COMPLETED'
      : 'IN_PROGRESS';

    return this.prisma.onboardingChecklist.update({
      where: { id },
      data: { ...merged, status },
    });
  }
}
