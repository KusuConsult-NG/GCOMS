import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post()
  createOrder(@Body() data: any, @Request() req: any) {
    if (req.user.role !== 'PROCUREMENT' && req.user.role !== 'EXECUTIVE') {
      throw new UnauthorizedException('Only Procurement and Executive roles can create orders');
    }
    return this.procurementService.createOrder(data, req.user.id);
  }

  @Get()
  getOrders(@Request() req: any) {
    if (req.user.role !== 'PROCUREMENT' && req.user.role !== 'EXECUTIVE') {
      throw new UnauthorizedException('Only Procurement and Executive roles can view orders');
    }
    return this.procurementService.getOrders();
  }
}
