import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';

/**
 * Tunable so operators can tighten or relax it without a code change, and so
 * tests that need many logins can raise it. Read at class-definition time, which
 * is why a spec must set it before importing AppModule.
 */
const LOGIN_LIMIT = Number(process.env.LOGIN_RATE_LIMIT ?? 5);
const LOGIN_TTL_MS = Number(process.env.LOGIN_RATE_TTL_MS ?? 60_000);

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Accounts are created by administrators via POST /users, not by self-service.
  //
  // Tighter than the global limit: bcrypt at cost 12 makes each attempt cheap to
  // send and expensive to answer, so this is both an anti-guessing and an
  // anti-exhaustion control.
  @Throttle({ default: { limit: LOGIN_LIMIT, ttl: LOGIN_TTL_MS } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() _dto: LoginDto, @Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
