import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Body,
  Controller,
  Delete,
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

  @Post()
  @Roles('EXECUTIVE', 'PROCUREMENT', 'ADMIN')
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

  @Patch(':id')
  @Roles('EXECUTIVE', 'PROCUREMENT', 'ADMIN', 'CLINICIAN')
  updateInventoryItem(
    @Param('id') id: string,
    @Body() data: UpdateInventoryItemDto,
    @Request() req: AuthenticatedRequest,
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
