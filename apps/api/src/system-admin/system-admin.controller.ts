import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SystemAdminService } from './system-admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system-admin/config')
export class SystemAdminController {
  constructor(private readonly systemAdminService: SystemAdminService) {}

  @Post()
  @Roles('EXECUTIVE', 'SYSTEM_ADMIN')
  setConfig(@Body() data: UpdateSystemConfigDto, @Request() req: any) {
    return this.systemAdminService.setConfig(data.key, data.value);
  }

  @Get()
  @Roles('EXECUTIVE', 'SYSTEM_ADMIN')
  getConfigs(@Request() req: any) {
    return this.systemAdminService.getConfigs();
  }
}
