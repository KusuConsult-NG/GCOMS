import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DOCUMENT_ROLES } from '../auth/roles.constants';
import { CreateDocumentDto } from './dto/create-document.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(...DOCUMENT_ROLES)
  createDocumentRecord(@Body() data: CreateDocumentDto, @Request() req: any) {
    return this.documentsService.createDocumentRecord(data, req.user.id);
  }

  @Get()
  getDocumentRecords() {
    return this.documentsService.getDocumentRecords();
  }
}
