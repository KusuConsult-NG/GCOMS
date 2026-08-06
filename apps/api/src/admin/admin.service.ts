import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createFacilityRequest(data: any, userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create FacilityRequest
      const request = await prisma.facilityRequest.create({
        data: {
          facilityName: data.facilityName,
          requestType: data.requestType,
          description: data.description,
          requestedById: userId,
        },
      });

      // 2. Create corresponding ApprovalRequest
      await prisma.approvalRequest.create({
        data: {
          title: `Facility ${data.requestType}: ${data.facilityName}`,
          description: data.description,
          resourceType: 'ADMIN',
          resourceId: request.id,
          requestedById: userId,
        },
      });

      return request;
    });
  }

  async getFacilityRequests() {
    return this.prisma.facilityRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });
  }
}
