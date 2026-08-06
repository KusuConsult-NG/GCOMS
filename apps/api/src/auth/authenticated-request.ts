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

export interface AuthenticatedRequest {
  user: AuthUser;
}
