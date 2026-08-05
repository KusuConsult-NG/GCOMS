import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Participant } from '@prisma/client';
export declare class ParticipantsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.ParticipantCreateInput): Promise<Participant>;
    findAll(search?: string): Promise<Participant[]>;
    findOne(id: string): Promise<Participant | null>;
}
