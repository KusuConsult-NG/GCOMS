import { CreateFinanceTransactionDto } from './dto/create-transaction.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
import { LedgerService } from './ledger.service';
import { CreateJournalEntryDto } from './dto/journal-entry.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly ledger: LedgerService,
  ) {}

  /*
   * The general ledger.
   *
   * Reading it is FINANCE_READ_ROLES, like the summary — a board member should
   * be able to open the books. Posting is FINANCE_WRITE_ROLES: a voucher is an
   * accounting act, not an approval, so it deliberately does not go through the
   * approvals queue that a requisition does.
   */
  @Get('accounts')
  @Roles(...FINANCE_READ_ROLES)
  listAccounts() {
    return this.ledger.listAccounts();
  }

  @Get('journal')
  @Roles(...FINANCE_READ_ROLES)
  listJournalEntries() {
    return this.ledger.listEntries();
  }

  @Get('journal/trial-balance')
  @Roles(...FINANCE_READ_ROLES)
  trialBalance() {
    return this.ledger.trialBalance();
  }

  @Get('journal/:id')
  @Roles(...FINANCE_READ_ROLES)
  getJournalEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.ledger.getEntry(id);
  }

  @Post('journal')
  @Roles(...FINANCE_WRITE_ROLES)
  postJournalEntry(
    @Body() dto: CreateJournalEntryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ledger.postEntry(dto, req.user.id);
  }

  // Was an inline role check; RolesGuard additionally admits SYSTEM_ADMIN, as
  // it does on every route.
  @Post()
  @Roles('FINANCE')
  createTransaction(
    @Body() data: CreateFinanceTransactionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.financeService.createTransaction(data, req.user.id);
  }

  @Get()
  @Roles('FINANCE')
  getTransactions(@Query('status') status?: string) {
    return this.financeService.getTransactions(status);
  }

  /** Approved-only figures. See FinanceService.getSummary. */
  @Get('summary')
  @Roles(...FINANCE_READ_ROLES)
  getSummary() {
    return this.financeService.getSummary();
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
