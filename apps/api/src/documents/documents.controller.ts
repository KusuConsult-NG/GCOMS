import { CreateDocumentRecordDto } from './dto/create-document-record.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { MAX_UPLOAD_BYTES } from './storage';
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
  createDocumentRecord(
    @Body() data: CreateDocumentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.documentsService.createDocumentRecord(data, req.user.id);
  }

  @Get()
  @Roles(...DOCUMENT_ROLES)
  getDocumentRecords() {
    return this.documentsService.getDocumentRecords();
  }

  /**
   * Multipart upload. memoryStorage is used deliberately: the file is validated
   * and checksummed before anything touches disk, so a rejected upload never
   * lands. The 20MB cap is enforced by multer as well as in the service, so an
   * oversized body is refused before it is buffered.
   */
  @Post('upload')
  @Roles(...DOCUMENT_ROLES)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() meta: { title?: string; documentType?: string; version?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.documentsService.upload(file, meta ?? {}, req.user.id);
  }

  /**
   * Downloads go through the API rather than a static path, because these files
   * may hold patient or financial data and a static directory has no idea who is
   * asking. Served as an attachment so a stored HTML file cannot execute in the
   * app's origin.
   */
  @Get(':id/download')
  @Roles(...DOCUMENT_ROLES)
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const doc = await this.documentsService.read(id);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.filename.replace(/"/g, '')}"`,
    );
    if (doc.intact === false) {
      // Served anyway, but the mismatch is stated rather than hidden.
      res.setHeader('X-Checksum-Mismatch', 'true');
    }
    res.send(doc.buffer);
  }
}
