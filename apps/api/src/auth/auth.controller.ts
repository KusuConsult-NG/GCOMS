import type {
  AuthenticatedRequest,
  LoginRequest,
} from './authenticated-request';
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
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Accounts are created by administrators via POST /users, not by self-service.
  //
  // Rate limiting lives in AppModule's `login-account` and `login-source`
  // throttlers, which bind to this handler by name. Keeping it there means the
  // per-account bucket is keyed off the request body, which a route decorator
  // cannot express.
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Body() _dto: LoginDto, @Request() req: LoginRequest) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
