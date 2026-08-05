import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  create(@Body() createParticipantDto: any, @Request() req: any) {
    const data: Prisma.ParticipantCreateInput = {
      ...createParticipantDto,
      dateOfBirth: new Date(createParticipantDto.dateOfBirth),
      registeredBy: {
        connect: { id: req.user.id }
      }
    };
    return this.participantsService.create(data);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.participantsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(id);
  }
}
