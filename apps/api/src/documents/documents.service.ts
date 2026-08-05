import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async createDocumentRecord(data: any, userId: string) {
    return this.prisma.documentRecord.create({
      data: {
        title: data.title,
        documentType: data.documentType,
        url: data.url,
        version: data.version,
        uploadedById: userId,
      }
    });
  }

  async getDocumentRecords() {
    return this.prisma.documentRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });
  }
}
