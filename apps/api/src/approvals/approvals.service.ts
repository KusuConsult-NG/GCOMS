import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createRequest(data: any, userId: string) {
    const request = await this.prisma.approvalRequest.create({
      data: {
        title: data.title,
        description: data.description,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        requestedById: userId,
      },
    });

    await this.notifications.sendEmail(
      'executives@gcoms.org',
      `New Approval Request: ${request.title}`,
      `A new request requires your approval. Description: ${request.description}`,
    );

    return request;
  }

  async getPendingRequests() {
    return this.prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async resolveRequest(id: string, status: string, executiveId: string) {
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      throw new Error('Invalid status');
    }

    const request = await this.prisma.approvalRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Approval request not found');

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update the ApprovalRequest itself
      const updatedRequest = await tx.approvalRequest.update({
        where: { id },
        data: {
          status,
          approvedById: executiveId,
        },
      });

      // 2. Sync the underlying resource if the request was APPROVED or REJECTED
      if (request.resourceId) {
        if (request.resourceType === 'FINANCE') {
          await tx.financeTransaction.update({
            where: { id: request.resourceId },
            data: { status },
          });
        } else if (request.resourceType === 'PROCUREMENT') {
          await tx.procurementOrder.update({
            where: { id: request.resourceId },
            data: { status },
          });
        } else if (request.resourceType === 'ADMIN') {
          await tx.facilityRequest.update({
            where: { id: request.resourceId },
            data: { status },
          });
        }
      }

      return updatedRequest;
    });

    // Notify original requester
    const requester = await this.prisma.user.findUnique({
      where: { id: request.requestedById },
    });
    if (requester) {
      await this.notifications.sendEmail(
        requester.email,
        `Approval Request ${status}: ${request.title}`,
        `Your request has been ${status} by executive ${executiveId}.`,
      );
    }

    return result;
  }
}
