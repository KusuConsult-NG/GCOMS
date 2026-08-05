import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const user = await this.usersService.findOne(cleanEmail);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user
    };
  }

  async register(data: any) {
    const cleanEmail = data.email ? data.email.trim().toLowerCase() : '';
    const existingUser = await this.usersService.findOne(cleanEmail);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await this.usersService.create({
      ...data,
      email: cleanEmail,
      password: hashedPassword
    });

    const { password, ...result } = newUser;
    return result;
  }
}
