import { IsIn } from 'class-validator';
import { ROLES } from '../../auth/roles.constants';
import type { Role } from '../../auth/roles.constants';

/**
 * Body for PATCH /users/:id. Deliberately role-only: this endpoint exists to
 * change privileges, and the global ValidationPipe whitelist keeps it from
 * quietly growing into a general-purpose user-update route.
 *
 * `role` is required, so AdminWorkspace's status toggle — which posts
 * `{ status: 'ACTIVE' | 'INACTIVE' }` to this same URL — gets an explicit 400
 * rather than a silent no-op. Activation needs its own endpoint against the
 * User model's `isActive` boolean.
 */
export class UpdateUserRoleDto {
  @IsIn(ROLES, { message: `role must be one of: ${ROLES.join(', ')}` })
  role: Role;
}
