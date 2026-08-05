import { IsBoolean } from 'class-validator';

/**
 * Body for PATCH /users/:id/status.
 *
 * Note this is `isActive: boolean`, matching the User model — not the
 * `status: 'ACTIVE' | 'INACTIVE'` string the old AdminWorkspace toggle sent to
 * a field that never existed.
 */
export class UpdateUserStatusDto {
  @IsBoolean({ message: 'isActive must be true or false' })
  isActive: boolean;
}
