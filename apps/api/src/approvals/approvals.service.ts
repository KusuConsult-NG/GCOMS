import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  APPROVAL_DECISIONS,
  APPROVER_ROLES,
  Role,
} from '../auth/roles.constants';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createRequest(data: CreateApprovalRequestDto, userId: string) {
    const request = await this.prisma.approvalRequest.create({
      data: {
        title: data.title,
        description: data.description,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        requestedById: userId,
      },
    });

    // Was hardcoded to executives@gcoms.org, an address no account owns, so no
    // approver was ever reachable. Notify the real approvers instead.
    const approvers = await this.prisma.user.findMany({
      where: { role: { in: [...APPROVER_ROLES] }, isActive: true },
      select: { email: true },
    });
    for (const approver of approvers) {
      await this.notifications.sendEmail(
        approver.email,
        `New Approval Request: ${request.title}`,
        `A new request requires your approval. Description: ${request.description}`,
      );
    }

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

  /**
   * `actor` is the resolving user, not just their id, because the role has to be
   * checked here rather than by the guard: RolesGuard grants EXECUTIVE and
   * SYSTEM_ADMIN every route unconditionally, so @Roles cannot exclude a system
   * admin. Authorising spend is not the same as administering the system, and
   * that separation is only expressible below the guard.
   */
  async resolveRequest(
    id: string,
    status: string,
    actor: { id: string; role: string },
  ) {
    if (!APPROVER_ROLES.includes(actor.role as Role)) {
      throw new ForbiddenException(
        `Only ${APPROVER_ROLES.join(' or ')} may resolve approvals`,
      );
    }
    const executiveId = actor.id;
    // The DTO already constrains this. Kept as defence in depth, because the
    // failure it prevents is a resource left in a status nothing recognises —
    // and as a BadRequestException rather than a plain Error, which the
    // exception filter could only map to a 500.
    if (!APPROVAL_DECISIONS.includes(status as 'APPROVED' | 'REJECTED')) {
      throw new BadRequestException(
        `status must be one of: ${APPROVAL_DECISIONS.join(', ')}`,
      );
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
        } else if (request.resourceType === 'HR_LEAVE') {
          await tx.leaveRequest.update({
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
