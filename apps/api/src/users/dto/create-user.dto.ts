import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLES } from '../../auth/roles.constants';
import type { Role } from '../../auth/roles.constants';

/**
 * Fields accepted when an administrator creates an account. The global
 * ValidationPipe runs with `whitelist: true`, so anything not declared here
 * (e.g. `department`, which HrWorkspace sends) is stripped before it reaches
 * Prisma rather than being written to the User row.
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  /** Omitted means DEFAULT_ROLE. Assigning a privileged role is checked in UsersService. */
  @IsOptional()
  @IsIn(ROLES, { message: `role must be one of: ${ROLES.join(', ')}` })
  role?: Role;
}
