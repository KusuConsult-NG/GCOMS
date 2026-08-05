import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post()
  createTransaction(@Body() data: any, @Request() req: any) {
    if (req.user.role !== 'FINANCE' && req.user.role !== 'EXECUTIVE') {
      throw new UnauthorizedException('Only Finance and Executive roles can create transactions');
    }
    return this.financeService.createTransaction(data, req.user.id);
  }

  @Get()
  getTransactions(@Request() req: any) {
    if (req.user.role !== 'FINANCE' && req.user.role !== 'EXECUTIVE') {
      throw new UnauthorizedException('Only Finance and Executive roles can view transactions');
    }
    return this.financeService.getTransactions();
  }
}
