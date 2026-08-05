import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface PhiActor {
    id: string;
    role: string;
}
export declare class PhiAccessService {
    private prisma;
    constructor(prisma: PrismaService);
    isUnscoped(role: string): boolean;
    participantScope(actor: PhiActor): Prisma.ParticipantWhereInput | undefined;
    assertParticipantAccess(actor: PhiActor, participantId: string, context: string): Promise<void>;
}
