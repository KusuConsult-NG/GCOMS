import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import {
  DEFAULT_ROLE,
  GRANTOR_ROLES,
  PRIVILEGED_ROLES,
  Role,
} from '../auth/roles.constants';

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

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
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
