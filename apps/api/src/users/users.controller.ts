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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { GRANTOR_ROLES, USER_ADMIN_ROLES } from '../auth/roles.constants';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('HR', 'EXECUTIVE', 'SYSTEM_ADMIN', 'ADMIN')
  async getUsers(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  /**
   * Account creation. Replaces the unauthenticated POST /auth/register, which
   * let anyone self-assign SYSTEM_ADMIN.
   */
  @Post()
  @Roles(...USER_ADMIN_ROLES)
  async createUser(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.usersService.createUser(dto, req.user.role);
  }

  /**
   * Change a user's role. Narrower than account creation: HR can onboard staff
   * but only EXECUTIVE/SYSTEM_ADMIN can move anyone between roles.
   */
  @Patch(':id')
  @Roles(...GRANTOR_ROLES)
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.usersService.updateRole(id, dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  /**
   * Activate or deactivate an account. A sub-route rather than another field on
   * PATCH /users/:id, so neither handler drifts into a general-purpose update.
   */
  @Patch(':id/status')
  @Roles(...GRANTOR_ROLES)
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: any,
  ) {
    return this.usersService.updateStatus(id, dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }
}
