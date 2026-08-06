import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  PROCUREMENT_READ_ROLES,
  PROCUREMENT_WRITE_ROLES,
} from '../auth/roles.constants';
import { CreateProcurementOrderDto } from './dto/create-order.dto';

// RolesGuard was missing, as it was on Finance and Hr. Without it @Roles is
// metadata nothing reads, so the decorators below would have been inert.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  // These were inline role checks naming two roles each, which is both narrower
  // than the rest of the module and invisible to anything that reads decorators.
  // The summary route had no check at all, so any authenticated caller could
  // read committed and pending procurement spend.
  @Post()
  @Roles(...PROCUREMENT_WRITE_ROLES)
  createOrder(
    @Body() dto: CreateProcurementOrderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.procurementService.createOrder(dto, req.user.id);
  }

  @Get()
  @Roles(...PROCUREMENT_READ_ROLES)
  getOrders() {
    return this.procurementService.getOrders();
  }

  @Get('summary')
  @Roles(...PROCUREMENT_READ_ROLES)
  getSummary() {
    return this.procurementService.getSummary();
  }
}
