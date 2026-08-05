import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { GrantsService } from './grants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('grants')
export class GrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  @Post()
  createGrant(@Body() data: any, @Request() req: any) {
    if (req.user.role !== 'EXECUTIVE' && req.user.role !== 'GRANT_MANAGER') {
      throw new UnauthorizedException('Only Executives or Grant Managers can create grants');
    }
    return this.grantsService.createGrant(data, req.user.id);
  }

  @Get()
  getGrants(@Request() req: any) {
    return this.grantsService.getGrants();
  }
}
