import { CreateGrantDto } from './dto/create-grant.dto';
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
import { GrantsService } from './grants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GRANT_READ_ROLES, GRANT_WRITE_ROLES } from '../auth/roles.constants';
import {
  CreateGrantProposalDto,
  UpdateGrantProposalDto,
  ListProposalQueryDto,
} from './dto/grant-proposal.dto';
import {
  CreateGrantMilestoneDto,
  ListGrantMilestoneQueryDto,
  UpdateGrantMilestoneDto,
} from './dto/grant-milestone.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grants')
export class GrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  @Get('milestones')
  @Roles(...GRANT_READ_ROLES)
  listMilestones(@Query() query: ListGrantMilestoneQueryDto) {
    return this.grantsService.listMilestones(query);
  }

  @Post('milestones')
  @Roles(...GRANT_WRITE_ROLES)
  createMilestone(@Body() dto: CreateGrantMilestoneDto) {
    return this.grantsService.createMilestone(dto);
  }

  @Patch('milestones/:id')
  @Roles(...GRANT_WRITE_ROLES)
  updateMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGrantMilestoneDto,
  ) {
    return this.grantsService.updateMilestone(id, dto);
  }

  @Delete('milestones/:id')
  @Roles(...GRANT_WRITE_ROLES)
  deleteMilestone(@Param('id', ParseUUIDPipe) id: string) {
    return this.grantsService.deleteMilestone(id);
  }

  // Was an inline role check throwing UnauthorizedException.
  @Post()
  @Roles(...GRANT_WRITE_ROLES)
  createGrant(
    @Body() data: CreateGrantDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.grantsService.createGrant(data, req.user.id);
  }

  @Get()
  @Roles(...GRANT_READ_ROLES)
  getGrants() {
    return this.grantsService.getGrants();
  }

  @Get('proposals')
  @Roles(...GRANT_READ_ROLES)
  listProposals(@Query() query: ListProposalQueryDto) {
    return this.grantsService.listProposals(query.status);
  }

  @Post('proposals')
  @Roles(...GRANT_WRITE_ROLES)
  createProposal(@Body() dto: CreateGrantProposalDto) {
    return this.grantsService.createProposal(dto);
  }

  @Patch('proposals/:id')
  @Roles(...GRANT_WRITE_ROLES)
  updateProposal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGrantProposalDto,
  ) {
    return this.grantsService.updateProposal(id, dto);
  }

  @Delete('proposals/:id')
  @Roles(...GRANT_WRITE_ROLES)
  deleteProposal(@Param('id', ParseUUIDPipe) id: string) {
    return this.grantsService.deleteProposal(id);
  }
}
