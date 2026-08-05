import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  async getAll() {
    return this.communitiesService.getAll();
  }

  @Post()
  @Roles('EXECUTIVE', 'FIELD_OFFICER', 'ADMIN', 'SYSTEM_ADMIN')
  async create(@Body() body: { name: string; lga: string; state?: string; population?: number; leaderName?: string }) {
    return this.communitiesService.create(body);
  }
}
