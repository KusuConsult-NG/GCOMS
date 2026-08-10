import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateLocationDto } from './dto/create-location.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async getAll() {
    return this.locationsService.getAll();
  }

  @Post()
  @Roles('EXECUTIVE', 'ADMIN', 'SYSTEM_ADMIN')
  async create(@Body() body: CreateLocationDto) {
    return this.locationsService.create(body);
  }
}
