import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ScreeningsService } from './screenings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @Post()
  createScreening(@Body() data: any, @Request() req: any) {
    return this.screeningsService.createScreening(data, req.user.id);
  }

  @Get('participant/:id')
  getScreenings(@Param('id') id: string) {
    return this.screeningsService.getScreenings(id);
  }
}
