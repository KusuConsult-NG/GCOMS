import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import {
  MAX_UPLOAD_BYTES,
  displayName,
  isAllowed,
  sha256,
  storedNameFor,
} from './storage';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService implements OnModuleInit {
  private uploadDir!: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    // Outside the web root by default. UPLOAD_DIR points it at a mounted volume
    // in a container, where the app directory is ephemeral.
    this.uploadDir = resolve(
      this.config.get<string>('UPLOAD_DIR') ??
        join(process.cwd(), 'storage', 'documents'),
    );
    await mkdir(this.uploadDir, { recursive: true });
  }

  async createDocumentRecord(data: any, userId: string) {
    return this.prisma.documentRecord.create({
      data: {
        title: data.title,
        documentType: data.documentType,
        url: data.url,
        version: data.version,
        uploadedById: userId,
      },
    });
  }

  async getDocumentRecords() {
    return this.prisma.documentRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  async upload(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    meta: { title?: string; documentType?: string; version?: string },
    userId: string,
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException('No file received');
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(
        `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit`,
      );
    }
    if (!isAllowed(file.mimetype, file.originalname)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype} (${file.originalname})`,
      );
    }

    const storedName = storedNameFor(file.originalname, file.mimetype);
    const original = displayName(file.originalname);

    // File written first, removed if the row fails. An orphaned file is
    // recoverable; a row pointing at nothing is not.
    await writeFile(join(this.uploadDir, storedName), file.buffer);
    try {
      return await this.prisma.documentRecord.create({
        data: {
          title: meta.title?.trim() || original,
          documentType: meta.documentType?.trim() || 'REPORT',
          version: meta.version?.trim() || '1.0',
          storedName,
          originalName: original,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          checksum: sha256(file.buffer),
          uploadedById: userId,
        },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (error) {
      await unlink(join(this.uploadDir, storedName)).catch(() => undefined);
      throw error;
    }
  }

  /** Reads a stored file and reports whether it still matches its upload checksum. */
  async read(id: string) {
    const record = await this.prisma.documentRecord.findUnique({
      where: { id },
    });
    if (!record || !record.storedName) {
      throw new NotFoundException('Document not found');
    }

    // resolve() plus a prefix check: even a corrupted storedName cannot read
    // outside the upload directory.
    const path = resolve(this.uploadDir, record.storedName);
    if (!path.startsWith(this.uploadDir)) {
      throw new NotFoundException('Document not found');
    }

    let buffer: Buffer;
    try {
      buffer = await readFile(path);
    } catch {
      throw new NotFoundException('The stored file is missing');
    }

    return {
      buffer,
      filename: record.originalName ?? 'document',
      mimeType: record.mimeType ?? 'application/octet-stream',
      intact: record.checksum ? sha256(buffer) === record.checksum : null,
    };
  }
}
