import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResearchService } from './research.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateResearchProjectDto,
  UpdateResearchProgressDto,
} from './dto/research.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get('projects')
  async getProjects() {
    return this.researchService.getAllProjects();
  }

  @Post('projects')
  @Roles('EXECUTIVE', 'RESEARCH_OFFICER', 'SYSTEM_ADMIN')
  async createProject(@Body() body: CreateResearchProjectDto) {
    return this.researchService.createProject(body.title);
  }

  @Patch('projects/:id/progress')
  @Roles('EXECUTIVE', 'RESEARCH_OFFICER', 'SYSTEM_ADMIN')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: UpdateResearchProgressDto,
  ) {
    return this.researchService.updateProgress(id, body.progress);
  }
}
