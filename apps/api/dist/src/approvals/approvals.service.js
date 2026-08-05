"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ApprovalsService = class ApprovalsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async createRequest(data, userId) {
        const request = await this.prisma.approvalRequest.create({
            data: {
                title: data.title,
                description: data.description,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                requestedById: userId,
            }
        });
        await this.notifications.sendEmail('executives@gcoms.org', `New Approval Request: ${request.title}`, `A new request requires your approval. Description: ${request.description}`);
        return request;
    }
    async getPendingRequests() {
        return this.prisma.approvalRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            include: {
                requestedBy: {
                    select: { firstName: true, lastName: true, role: true }
                }
            }
        });
    }
    async resolveRequest(id, status, executiveId) {
        if (status !== 'APPROVED' && status !== 'REJECTED') {
            throw new Error('Invalid status');
        }
        const request = await this.prisma.approvalRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('Approval request not found');
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.approvalRequest.update({
                where: { id },
                data: {
                    status,
                    approvedById: executiveId,
                }
            });
            if (request.resourceId) {
                if (request.resourceType === 'FINANCE') {
                    await tx.financeTransaction.update({
                        where: { id: request.resourceId },
                        data: { status }
                    });
                }
                else if (request.resourceType === 'PROCUREMENT') {
                    await tx.procurementOrder.update({
                        where: { id: request.resourceId },
                        data: { status }
                    });
                }
                else if (request.resourceType === 'ADMIN') {
                    await tx.facilityRequest.update({
                        where: { id: request.resourceId },
                        data: { status }
                    });
                }
            }
            return updatedRequest;
        });
        const requester = await this.prisma.user.findUnique({ where: { id: request.requestedById } });
        if (requester) {
            await this.notifications.sendEmail(requester.email, `Approval Request ${status}: ${request.title}`, `Your request has been ${status} by executive ${executiveId}.`);
        }
        return result;
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map