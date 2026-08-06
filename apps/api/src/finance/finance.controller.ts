import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  FINANCE_READ_ROLES,
  FINANCE_WRITE_ROLES,
} from '../auth/roles.constants';
import {
  CreateReconciliationDto,
  UpdateReconciliationDto,
  ListReconciliationQueryDto,
} from './dto/bank-reconciliation.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Was an inline role check; RolesGuard additionally admits SYSTEM_ADMIN, as
  // it does on every route.
  @Post()
  @Roles('FINANCE')
  createTransaction(@Body() data: any, @Request() req: any) {
    return this.financeService.createTransaction(data, req.user.id);
  }

  @Get()
  @Roles('FINANCE')
  getTransactions() {
    return this.financeService.getTransactions();
  }

  @Get('reconciliations')
  @Roles(...FINANCE_READ_ROLES)
  listReconciliations(@Query() query: ListReconciliationQueryDto) {
    return this.financeService.listReconciliations(query.status);
  }

  @Post('reconciliations')
  @Roles(...FINANCE_WRITE_ROLES)
  createReconciliation(@Body() dto: CreateReconciliationDto) {
    return this.financeService.createReconciliation(dto);
  }

  @Patch('reconciliations/:id')
  @Roles(...FINANCE_WRITE_ROLES)
  updateReconciliation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReconciliationDto,
  ) {
    return this.financeService.updateReconciliation(id, dto);
  }
}
