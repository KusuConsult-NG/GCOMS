import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async createStaffRecord(data: any, hrManagerId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create the user account with a default password (e.g., 'password123')
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
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
        }
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
            select: { id: true, firstName: true, lastName: true, email: true, role: true }
          }
        }
      });

      return staffRecord;
    });
  }

  async getStaffRecords() {
    return this.prisma.staffRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        managedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });
  }
}
