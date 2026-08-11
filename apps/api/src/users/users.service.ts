import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  DEFAULT_ROLE,
  GRANTOR_ROLES,
  PRIVILEGED_ROLES,
  Role,
  USER_ADMIN_ROLES,
} from '../auth/roles.constants';
import { PaginationQueryDto, paginate } from '../common/pagination';

export const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  password: false,
} as const;

const BCRYPT_ROUNDS = 12;

/** Same shape the seed generates: long, random, and shown once. */
function generatePassword(): string {
  return `${randomBytes(12).toString('base64url')}Aa1!`;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string, pagination?: PaginationQueryDto) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      ...paginate(pagination),
    });
  }

  /** Returns the full row including the password hash — for authentication only. */
  async findOne(email: string): Promise<User | null> {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    return this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  /**
   * Creates an account on behalf of an administrator.
   *
   * Fields are mapped explicitly rather than spread, so a caller cannot set
   * columns the DTO does not expose. `actorRole` is the authenticated caller's
   * role: it gates who may hand out the roles that RolesGuard treats as
   * all-access, which is what made self-registration an escalation path.
   */
  async createUser(dto: CreateUserDto, actorRole: string) {
    const requestedRole: Role = dto.role ?? DEFAULT_ROLE;

    if (
      PRIVILEGED_ROLES.includes(requestedRole) &&
      !GRANTOR_ROLES.includes(actorRole as Role)
    ) {
      throw new ForbiddenException(
        `Only ${GRANTOR_ROLES.join(' or ')} may assign the ${requestedRole} role`,
      );
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email,
        password,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: requestedRole,
      },
      select: userSelect,
    });
  }

  /**
   * Changes another user's role.
   *
   * Callers are already narrowed to GRANTOR_ROLES by the controller guard; the
   * check is repeated here so the rule survives someone loosening @Roles later.
   *
   * Actors may not change their own role. That closes self-promotion, and it
   * also guarantees at least one grantor always remains: an actor can demote
   * every other administrator but never the account they are signed in as.
   */
  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    actor: { id: string; role: string },
  ) {
    if (!GRANTOR_ROLES.includes(actor.role as Role)) {
      throw new ForbiddenException(
        `Only ${GRANTOR_ROLES.join(' or ')} may change user roles`,
      );
    }

    if (id === actor.id) {
      throw new ForbiddenException(
        'You cannot change your own role. Ask another administrator.',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === dto.role) {
      return this.findById(id);
    }

    // Update and audit together — a privilege change that isn't recorded is
    // worse than one that fails.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { role: dto.role },
        select: userSelect,
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_ROLE_CHANGED',
          oldData: JSON.stringify({
            userId: target.id,
            email: target.email,
            role: target.role,
          }),
          newData: JSON.stringify({
            userId: target.id,
            email: target.email,
            role: dto.role,
          }),
          userId: actor.id,
        },
      });

      return updated;
    });
  }

  /**
   * Resets another user's password and returns the new one, once.
   *
   * Who may do this is deliberately wider than updateRole and narrower than it
   * looks. USER_ADMIN_ROLES covers it because those roles can already create an
   * account and choose its password — withholding a reset from HR while
   * allowing account creation would be a distinction without a difference, and
   * it is HR that fields a locked-out member of staff.
   *
   * But resetting the password of a privileged account is account takeover, so
   * that is restricted to GRANTOR_ROLES, mirroring who may hand the role out in
   * the first place. Without it, HR could reset the executive's password and
   * sign in as them, which is the same escalation self-registration was.
   *
   * Self-targeting is refused for a different reason than in updateRole: a
   * password an administrator sets for themselves through an admin screen is
   * not a password change, it is a way to bypass whatever a real change-password
   * flow would ask for.
   */
  async resetPassword(
    id: string,
    dto: ResetPasswordDto,
    actor: { id: string; role: string },
  ) {
    if (!USER_ADMIN_ROLES.includes(actor.role as Role)) {
      throw new ForbiddenException(
        `Only ${USER_ADMIN_ROLES.join(' or ')} may reset passwords`,
      );
    }

    if (id === actor.id) {
      throw new ForbiddenException(
        'You cannot reset your own password from the administration screen.',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (
      PRIVILEGED_ROLES.includes(target.role as Role) &&
      !GRANTOR_ROLES.includes(actor.role as Role)
    ) {
      throw new ForbiddenException(
        `Only ${GRANTOR_ROLES.join(' or ')} may reset the password of a ` +
          `${target.role} account`,
      );
    }

    const plain = dto.password ?? generatePassword();
    const password = await bcrypt.hash(plain, BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { password } });
      // The password itself is never written here. What is recorded is that a
      // reset happened, to whom, and by whom — which is what an audit of a
      // compromised account needs.
      await tx.auditLog.create({
        data: {
          action: 'USER_PASSWORD_RESET',
          newData: JSON.stringify({ userId: target.id, email: target.email }),
          userId: actor.id,
        },
      });
    });

    // Returned once and never retrievable again; there is nowhere to read it
    // back from.
    return { id: target.id, email: target.email, temporaryPassword: plain };
  }

  /**
   * Activates or deactivates another user's account.
   *
   * Same guard rails as updateRole: grantor-only, re-checked here rather than
   * trusting the controller alone, and never self-targeted — an actor can
   * deactivate every other administrator but not the account they are signed in
   * as, so the organisation cannot lock itself out.
   *
   * Deactivation is enforced in AuthService.validateUser. Note it only blocks
   * new logins: a token issued before deactivation stays valid until it expires.
   */
  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    actor: { id: string; role: string },
  ) {
    if (!GRANTOR_ROLES.includes(actor.role as Role)) {
      throw new ForbiddenException(
        `Only ${GRANTOR_ROLES.join(' or ')} may activate or deactivate accounts`,
      );
    }

    if (id === actor.id) {
      throw new ForbiddenException(
        'You cannot deactivate your own account. Ask another administrator.',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, isActive: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.isActive === dto.isActive) {
      return this.findById(id);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { isActive: dto.isActive },
        select: userSelect,
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_STATUS_CHANGED',
          oldData: JSON.stringify({
            userId: target.id,
            email: target.email,
            isActive: target.isActive,
          }),
          newData: JSON.stringify({
            userId: target.id,
            email: target.email,
            isActive: dto.isActive,
          }),
          userId: actor.id,
        },
      });

      return updated;
    });
  }
}
