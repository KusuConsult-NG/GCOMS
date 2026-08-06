import type { SanitisedUser } from './authenticated-request';
import type { JwtPayload } from './jwt-payload';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Returns the caller's identity, or null when the credentials do not match.
   *
   * The return type was `Promise<any>`, which made every consumer's `req.user`
   * unchecked all the way down — LocalStrategy returns this verbatim, and it is
   * what Passport attaches to the request.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<SanitisedUser | null> {
    // LocalAuthGuard runs ahead of the ValidationPipe, so these arrive unvalidated.
    // A non-string here would otherwise reach Prisma as a filter object.
    if (typeof email !== 'string' || typeof pass !== 'string') {
      return null;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await this.usersService.findOne(cleanEmail);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // Deliberately checked *after* the password matches. Reaching this branch
      // requires already knowing the credentials, so naming the real reason
      // discloses nothing — and it saves deactivated field staff from chasing a
      // password they typed correctly. Thrown rather than returned as null so it
      // surfaces as 403, which the login page renders verbatim (a 401 there is
      // hardcoded to "Invalid email or password").
      if (!user.isActive) {
        throw new ForbiddenException(
          'This account has been deactivated. Contact an administrator.',
        );
      }

      // The hash must not travel with the user object. Named and voided rather
      // than left dangling, so the omission reads as deliberate.
      const { password: _hash, ...result } = user;
      void _hash;
      return result;
    }
    return null;
  }

  // Not async: signing is synchronous. The signature said otherwise, which is
  // the kind of thing that makes a caller add an await it does not need and
  // omit one it does.
  login(user: SanitisedUser) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
