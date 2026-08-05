import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PHI_READ_ROLES } from '../auth/roles.constants';
import { CreateParticipantDto } from './dto/create-participant.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  @Roles(...PHI_READ_ROLES)
  create(@Body() dto: CreateParticipantDto, @Request() req: any) {
    return this.participantsService.create(dto, req.user.id);
  }

  /**
   * Scoped: front-line roles get their own caseload, oversight roles get
   * everything. Search is scoped too, so this cannot be used to enumerate the
   * patient index.
   */
  @Get()
  @Roles(...PHI_READ_ROLES)
  findAll(@Request() req: any, @Query('search') search?: string) {
    return this.participantsService.findAll(req.user, search);
  }

  /**
   * Reachable by id for any patient, including outside the caller's caseload —
   * see PhiAccessService.assertParticipantAccess for why, and what is logged.
   */
  @Get(':id')
  @Roles(...PHI_READ_ROLES)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.participantsService.findOne(id, req.user);
  }
}
