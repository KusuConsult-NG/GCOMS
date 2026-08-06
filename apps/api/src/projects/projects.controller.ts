import { CreateProjectDto } from './dto/create-project.dto';
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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  PROJECT_READ_ROLES,
  PROJECT_WRITE_ROLES,
} from '../auth/roles.constants';
import {
  CreateProjectTaskDto,
  ListProjectTaskQueryDto,
  UpdateProjectTaskDto,
} from './dto/project-task.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /*
   * Task routes are declared before the collection routes. They cannot actually
   * collide — 'tasks' is a literal segment — but declaring them first keeps the
   * intent obvious if someone later adds a `:projectId` route to this controller.
   */

  @Get('tasks')
  @Roles(...PROJECT_READ_ROLES)
  listTasks(@Query() query: ListProjectTaskQueryDto) {
    return this.projectsService.listTasks(query);
  }

  @Post('tasks')
  @Roles(...PROJECT_WRITE_ROLES)
  createTask(@Body() dto: CreateProjectTaskDto) {
    return this.projectsService.createTask(dto);
  }

  @Patch('tasks/:id')
  @Roles(...PROJECT_WRITE_ROLES)
  updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectTaskDto,
  ) {
    return this.projectsService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  @Roles(...PROJECT_WRITE_ROLES)
  deleteTask(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.deleteTask(id);
  }

  // Was an inline `req.user.role !== ...` check throwing UnauthorizedException.
  @Post()
  @Roles(...PROJECT_WRITE_ROLES)
  createProject(
    @Body() data: CreateProjectDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.projectsService.createProject(data, req.user.id);
  }

  @Get()
  @Roles(...PROJECT_READ_ROLES)
  getProjects() {
    return this.projectsService.getProjects();
  }
}
