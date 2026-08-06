import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { EMPLOYMENT_TYPES, ROLES } from '../../auth/roles.constants';
import type { Role } from '../../auth/roles.constants';

/**
 * Onboarding a staff member creates a user account, so this carries the same
 * constraints as CreateUserDto — and the service applies the same privileged-role
 * rule.
 *
 * It previously took `data: any`. With no DTO there is no metadata for the
 * global ValidationPipe to whitelist against, so the whole body passed through:
 * `role` was written to the User row unchecked, and the password was the string
 * literal 'password123'.
 */
export class CreateStaffRecordDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(128)
  password: string;

  @IsString() @MinLength(1) @MaxLength(100) firstName: string;
  @IsString() @MinLength(1) @MaxLength(100) lastName: string;

  @IsIn(ROLES, { message: `role must be one of: ${ROLES.join(', ')}` })
  role: Role;

  @IsString() @MinLength(1) @MaxLength(120) department: string;

  @IsIn(EMPLOYMENT_TYPES, {
    message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}`,
  })
  employmentType: string;
}
