import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  createRequest(@Body() data: any, @Request() req: any) {
    return this.approvalsService.createRequest(data, req.user.id);
  }

  @Get()
  getRequests(@Request() req: any) {
    if (!['EXECUTIVE', 'ADMIN', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException('Only Executive and Admin roles can view approvals');
    }
    return this.approvalsService.getPendingRequests();
  }

  @Get('pending')
  getPendingRequests(@Request() req: any) {
    return this.getRequests(req);
  }

  @Patch(':id')
  resolveRequest(@Param('id') id: string, @Body() data: { status: string }, @Request() req: any) {
    if (req.user.role !== 'EXECUTIVE') {
      throw new UnauthorizedException('Only Executives can resolve approvals');
    }
    return this.approvalsService.resolveRequest(id, data.status, req.user.id);
  }
}
