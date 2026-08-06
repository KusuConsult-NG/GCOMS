import type { User as PrismaUser } from '@prisma/client';

/**
 * The request as it looks after JwtAuthGuard has run.
 *
 * Every controller behind the guard typed this as `@Request() req: any`, in 54
 * places. That makes `req.user.id` and `req.user.role` unchecked reads: a rename
 * in the JWT payload would compile everywhere and arrive as undefined at
 * runtime — as a user id matching no row, or as a role matching no entry in a
 * permission list, which is the direction that fails open.
 *
 * The shape comes from JwtStrategy.validate, which is what Passport attaches.
 * Keep the two in step.
 *
 * Import it with `import type`: a value import of a type used in a decorated
 * parameter is an error under isolatedModules with emitDecoratorMetadata.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * The full account, minus the password hash.
 *
 * LocalStrategy attaches this on the login route, and it is what the login
 * response returns — the web client reads firstName and lastName from it for
 * the signed-in user's name. Narrowing it to AuthUser would compile fine and
 * blank the name in the sidebar.
 */
export type SanitisedUser = Omit<PrismaUser, 'password'>;

export interface AuthenticatedRequest {
  user: AuthUser;
}

/**
 * The login route only. LocalStrategy attaches the full account there, whereas
 * every other route is behind JwtAuthGuard and gets the three claims above.
 * Distinguishing the two is what keeps `req.user.firstName` from type-checking
 * on routes where it does not exist.
 */
export interface LoginRequest {
  user: SanitisedUser;
}
