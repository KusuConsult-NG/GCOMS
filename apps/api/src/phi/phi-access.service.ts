import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PHI_UNSCOPED_ROLES, Role } from '../auth/roles.constants';

/** The authenticated caller, as JwtStrategy.validate builds it. */
export interface PhiActor {
  id: string;
  role: string;
}

/**
 * Single place that answers "which patients may this user see?".
 *
 * Role membership (can this user touch PHI at all?) is enforced by RolesGuard
 * with @Roles(...PHI_READ_ROLES). This service handles the second half —
 * which *records* within that permission, which guards cannot express.
 */
@Injectable()
export class PhiAccessService {
  constructor(private prisma: PrismaService) {}

  isUnscoped(role: string): boolean {
    return PHI_UNSCOPED_ROLES.includes(role as Role);
  }

  /**
   * Prisma filter narrowing Participant reads to the caller's own caseload.
   * `undefined` means no restriction — spread it into a `where` and oversight
   * roles keep seeing everything.
   */
  participantScope(actor: PhiActor): Prisma.ParticipantWhereInput | undefined {
    if (this.isUnscoped(actor.role)) {
      return undefined;
    }
    return {
      OR: [
        { registeredById: actor.id },
        { assignments: { some: { clinicianId: actor.id } } },
      ],
    };
  }

  /**
   * Gate a single participant's record.
   *
   * In scope: returns silently. Out of scope: still allowed — a clinician must
   * never be blocked from a walk-in or emergency by missing paperwork — but the
   * access is recorded as PHI_ACCESS_OVERRIDE so it is accountable after the
   * fact. Unknown id is a 404 for everyone.
   */
  async assertParticipantAccess(
    actor: PhiActor,
    participantId: string,
    context: string,
  ): Promise<void> {
    if (this.isUnscoped(actor.role)) {
      return;
    }

    const scope = this.participantScope(actor);
    const inScope = await this.prisma.participant.findFirst({
      where: { id: participantId, ...scope },
      select: { id: true },
    });
    if (inScope) {
      return;
    }

    const exists = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Participant not found');
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'PHI_ACCESS_OVERRIDE',
        newData: JSON.stringify({
          participantId,
          context,
          actorRole: actor.role,
        }),
        userId: actor.id,
      },
    });
  }
}
