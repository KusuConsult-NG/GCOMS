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

  async validateUser(email: string, pass: string): Promise<any> {
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

      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
