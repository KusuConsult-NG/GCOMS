import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('EXECUTIVE', 'PROCUREMENT', 'ADMIN')
  createInventoryItem(@Body() data: CreateInventoryItemDto, @Request() req: any) {
    return this.inventoryService.createInventoryItem(data, req.user.id);
  }

  @Get()
  getInventoryItems() {
    return this.inventoryService.getInventoryItems();
  }

  @Patch(':id')
  @Roles('EXECUTIVE', 'PROCUREMENT', 'ADMIN', 'CLINICIAN')
  updateInventoryItem(@Param('id') id: string, @Body() data: UpdateInventoryItemDto, @Request() req: any) {
    return this.inventoryService.updateInventoryItem(id, data);
  }
}

