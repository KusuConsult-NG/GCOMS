import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createFacilityRequest(data: any, userId: string) {
    const created = await this.prisma.$transaction(async (prisma) => {
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

    // Reaches the people who can actually resolve it.
    await this.notifications.notifyApprovers(
      `Facility: ${data.facilityName}`,
      `${data.requestType} — ${data.description}`,
    );
    return created;
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
