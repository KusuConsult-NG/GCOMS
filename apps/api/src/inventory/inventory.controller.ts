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
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import {
  INVENTORY_READ_ROLES,
  INVENTORY_WRITE_ROLES,
} from '../auth/roles.constants';
import {
  CreateServiceLogDto,
  UpdateServiceLogDto,
  ListServiceLogQueryDto,
} from './dto/service-log.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * INVENTORY_WRITE_ROLES plus PROCUREMENT, which books received goods in as
   * stock.
   *
   * This was a hardcoded list predating the constant — the service-log routes
   * below were added with it, these were not — and it omitted INVENTORY_MANAGER
   * entirely. So the role named for this module could open /inventory (the page
   * admits it), fill in the asset form, and receive a 403 on submit. It could
   * already write the service logs on the same module, which is what made the
   * omission look like an oversight rather than a policy.
   */
  @Post()
  @Roles(...INVENTORY_WRITE_ROLES, 'PROCUREMENT')
  createInventoryItem(
    @Body() data: CreateInventoryItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.createInventoryItem(data, req.user.id);
  }

  @Get()
  @Roles(...INVENTORY_READ_ROLES)
  getInventoryItems() {
    return this.inventoryService.getInventoryItems();
  }

  /**
   * Same list, plus CLINICIAN: consuming stock at a screening is a quantity
   * update, and that was the reason the role was here before.
   */
  @Patch(':id')
  @Roles(...INVENTORY_WRITE_ROLES, 'PROCUREMENT', 'CLINICIAN')
  updateInventoryItem(
    // Was untyped, so a malformed id reached Prisma and surfaced as an opaque
    // error rather than a 400. The service-log route below already did this.
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateInventoryItem(id, data);
  }

  @Get('service-logs')
  @Roles(...INVENTORY_READ_ROLES)
  listServiceLogs(@Query() query: ListServiceLogQueryDto) {
    return this.inventoryService.listServiceLogs(query);
  }

  @Post('service-logs')
  @Roles(...INVENTORY_WRITE_ROLES)
  createServiceLog(@Body() dto: CreateServiceLogDto) {
    return this.inventoryService.createServiceLog(dto);
  }

  @Patch('service-logs/:id')
  @Roles(...INVENTORY_WRITE_ROLES)
  updateServiceLog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceLogDto,
  ) {
    return this.inventoryService.updateServiceLog(id, dto);
  }
}
