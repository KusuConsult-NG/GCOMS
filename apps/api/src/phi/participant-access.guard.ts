import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PhiAccessService } from './phi-access.service';

/**
 * Applies PhiAccessService.assertParticipantAccess to a route that names a
 * participant directly, looking in order at:
 *
 *   1. `:participantId` in the path
 *   2. `:id` in the path
 *   3. `participantId` in the request body   (create endpoints)
 *
 * Body parsing runs as middleware, ahead of guards, so (3) is available here.
 *
 * IMPORTANT: because of (2), only attach this to routes where `:id` really is a
 * participant id. Endpoints keyed by a *record* id — PATCH /follow-ups/:id/status
 * and friends — must resolve the owning participant in their service instead;
 * this guard would treat the record id as a participant and 404.
 */
@Injectable()
export class ParticipantAccessGuard implements CanActivate {
  constructor(private readonly phi: PhiAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const participantId =
      request.params?.participantId ??
      request.params?.id ??
      request.body?.participantId;

    if (!participantId || !request.user) {
      return true;
    }

    await this.phi.assertParticipantAccess(
      request.user,
      participantId,
      `${request.method} ${request.route?.path ?? request.url}`,
    );
    return true;
  }
}
