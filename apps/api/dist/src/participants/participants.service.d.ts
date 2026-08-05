import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Participant } from '@prisma/client';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
export declare class ParticipantsService {
    private prisma;
    private phi;
    constructor(prisma: PrismaService, phi: PhiAccessService);
    create(data: Prisma.ParticipantCreateInput): Promise<Participant>;
    findAll(actor: PhiActor, search?: string): Promise<Participant[]>;
    findOne(id: string, actor: PhiActor): Promise<Participant | null>;
}
