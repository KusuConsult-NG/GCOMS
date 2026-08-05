import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(@Body() data: any, @Request() req: any) {
    if (req.user.role !== 'EXECUTIVE' && req.user.role !== 'PROJECT_MANAGER') {
      throw new UnauthorizedException('Only Executives or Project Managers can create projects');
    }
    return this.projectsService.createProject(data, req.user.id);
  }

  @Get()
  getProjects(@Request() req: any) {
    return this.projectsService.getProjects();
  }
}
