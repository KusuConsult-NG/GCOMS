import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles('CLINICIAN', 'HR', 'FINANCE', 'PROCUREMENT', 'GRANT_MANAGER', 'PROJECT_MANAGER', 'ADMIN', 'EXECUTIVE', 'BOARD', 'SYSTEM_ADMIN')
  createDocumentRecord(@Body() data: CreateDocumentDto, @Request() req: any) {
    return this.documentsService.createDocumentRecord(data, req.user.id);
  }

  @Get()
  getDocumentRecords() {
    return this.documentsService.getDocumentRecords();
  }
}

