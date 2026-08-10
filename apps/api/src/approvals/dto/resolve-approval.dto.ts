import { IsIn } from 'class-validator';
import { APPROVAL_DECISIONS } from '../../auth/roles.constants';

/**
 * The decision on an approval request.
 *
 * This endpoint took `@Body() data: { status: string }` — a bare type
 * annotation, which is erased at compile time and validates nothing. The
 * service's own guard against a bad value threw a plain `Error`, and a plain
 * Error is not an HttpException, so the exception filter had nothing to map and
 * returned 500. A caller sending `{ status: 'BANANA' }` was told the server had
 * failed, when in fact it had understood perfectly and refused.
 *
 * PENDING is deliberately not accepted: this route resolves a request, and
 * moving one back to PENDING after the fact would clear `approvedById` on the
 * underlying record without any trace that a decision had been taken.
 */
export class ResolveApprovalDto {
  @IsIn(APPROVAL_DECISIONS, {
    message: `status must be one of: ${APPROVAL_DECISIONS.join(', ')}`,
  })
  status: string;
}
