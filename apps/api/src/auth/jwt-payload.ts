/**
 * The claims this application signs and expects back.
 *
 * JwtStrategy.validate took `payload: any`, so `payload.sub` and `payload.role`
 * were unchecked reads at the exact point a token is turned into an identity. A
 * claim renamed on one side and not the other would compile, and every request
 * would arrive with `role: undefined` — which RolesGuard compares against its
 * required list and, for a route with no @Roles, admits.
 *
 * `sub` is the standard subject claim, and holds the user id.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
