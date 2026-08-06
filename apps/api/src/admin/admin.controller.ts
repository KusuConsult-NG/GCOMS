import { CreateFacilityRequestDto } from './dto/create-facility-request.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/facilities')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @Roles('ADMIN', 'EXECUTIVE')
  createFacilityRequest(
    @Body() data: CreateFacilityRequestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.createFacilityRequest(data, req.user.id);
  }

  @Get()
  @Roles('ADMIN', 'EXECUTIVE')
  getFacilityRequests() {
    return this.adminService.getFacilityRequests();
  }
}
