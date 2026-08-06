import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GOVERNANCE_ROLES } from '../auth/roles.constants';
import {
  CreateBoardResolutionDto,
  ListResolutionQueryDto,
  UpdateBoardResolutionDto,
} from './dto/board-resolution.dto';

/**
 * Separate controller because GovernanceController is mounted at
 * 'governance/meetings'.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('governance/resolutions')
export class GovernanceResolutionsController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get()
  @Roles(...GOVERNANCE_ROLES)
  list(@Query() query: ListResolutionQueryDto) {
    return this.governanceService.listResolutions(query.status);
  }

  @Post()
  @Roles(...GOVERNANCE_ROLES)
  create(@Body() dto: CreateBoardResolutionDto) {
    return this.governanceService.createResolution(dto);
  }

  @Patch(':id')
  @Roles(...GOVERNANCE_ROLES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoardResolutionDto,
  ) {
    return this.governanceService.updateResolution(id, dto);
  }
}
