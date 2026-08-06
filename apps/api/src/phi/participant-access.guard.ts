import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PhiAccessService, PhiActor } from './phi-access.service';

/**
 * What this guard needs off the request. Express's own `Request` types `user`
 * via passport's declaration merging, which does not describe our JWT payload,
 * and `route` is not on the public type at all.
 */
type PhiRequest = Omit<Request, 'route'> & {
  user?: PhiActor;
  route?: { path?: string };
};

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
    const request = context.switchToHttp().getRequest<PhiRequest>();
    // Express types a route parameter as `string | string[]`, because a pattern
    // can bind the same name more than once. None of these routes do, but a
    // non-string here must not reach the access check as one — it would be
    // compared against stored ids and silently fail to match.
    const candidate =
      request.params?.participantId ??
      request.params?.id ??
      (request.body as { participantId?: unknown } | undefined)?.participantId;
    const participantId = typeof candidate === 'string' ? candidate : undefined;

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
