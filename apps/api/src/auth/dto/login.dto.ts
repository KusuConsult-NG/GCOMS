import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Documents and whitelists the login body. Note that LocalAuthGuard runs before
 * pipes, so LocalStrategy sees the raw body first — AuthService.validateUser
 * type-checks its inputs for that reason rather than relying on this DTO.
 */
export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
