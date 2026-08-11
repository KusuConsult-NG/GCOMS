import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Body for PATCH /users/:id/password.
 *
 * There was no such route. The administration screen's "Reset Pwd" button sent
 * `{ password: 'GCOMS@2026!' }` to PATCH /users/:id, whose DTO declares only
 * `role` — so the request was refused outright, the handler logged to the
 * console, and the button did nothing at all for as long as it existed.
 *
 * The replacement does not take a password from the client by default. A fixed
 * string in the browser bundle is the same password for every reset, forever,
 * and it is readable by anyone who opens the sources. Omit `password` and the
 * server generates one and returns it once, the way the seed does.
 */
export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(128)
  password?: string;
}
