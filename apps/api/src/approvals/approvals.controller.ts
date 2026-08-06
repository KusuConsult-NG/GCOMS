import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { APPROVAL_VIEW_ROLES, APPROVER_ROLES } from '../auth/roles.constants';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  createRequest(
    @Body() data: CreateApprovalRequestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.approvalsService.createRequest(data, req.user.id);
  }

  @Get()
  @Roles(...APPROVAL_VIEW_ROLES)
  getRequests() {
    return this.approvalsService.getPendingRequests();
  }

  @Get('pending')
  @Roles(...APPROVAL_VIEW_ROLES)
  getPendingRequests() {
    return this.getRequests();
  }

  @Patch(':id')
  @Roles(...APPROVER_ROLES)
  resolveRequest(
    @Param('id') id: string,
    @Body() data: { status: string },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.approvalsService.resolveRequest(id, data.status, req.user);
  }
}
