# GCOMS — API

NestJS 11 + Prisma + PostgreSQL 16. Thirty-seven controllers over fifty-seven
tables, covering clinical, field, finance, HR, procurement, grants, governance
and administration.

See the [repository README](../../README.md) for the stack as a whole, and
`.env.example` for configuration — every variable is documented there.

```bash
npm ci
cp .env.example .env      # set JWT_SECRET and DATABASE_URL
npx prisma generate
npm run db:migrate
npm run db:seed           # optional
npm run start:dev         # :3001
```

The app validates its environment at boot (`src/config/env.validation.ts`) and
refuses to start with a missing, short, or placeholder `JWT_SECRET`, or — in
production — with an empty `ALLOWED_ORIGINS`.

## Access control

- `JwtAuthGuard` on every controller except `/` and `/health`.
- `RolesGuard` + `@Roles(...)` for per-route roles. `EXECUTIVE` and
  `SYSTEM_ADMIN` are granted every route unconditionally; only `GRANTOR_ROLES`
  may hand those out, so HR creating staff accounts cannot mint itself an
  executive. `src/auth/roles.constants.ts` is the single source of truth.
- `/dashboard/stats` is deliberately open to every authenticated role — it is
  the landing page for finance and HR too — and filters PHI inside the service
  rather than by denying the endpoint.
- `/exports/:dataset` is one route rather than a download button per module, and
  each dataset carries its own role requirement checked in the service: a bulk
  read must not become a way around per-module permissions.

## Database

One Postgres baseline migration, not a ported SQLite history. SQLite is not
supported: `contains` searches rely on `mode: 'insensitive'`, and patient search
would silently stop matching without it.

```bash
npm run db:migrate    # prisma migrate deploy
npm run db:seed
npm run db:reset      # destructive
```

Migrations are deliberately not run at boot — run them as a release step so a
rolling deploy does not have several instances migrating at once.

## Tests

```bash
npx jest                                       # 190 unit
npx jest --config ./test/jest-e2e.json         # 41 end-to-end, needs TEST_DATABASE_URL
npx eslint "src/**/*.ts" --max-warnings 0
npm run typecheck                              # covers specs; the build config excludes them
```

`TEST_DATABASE_URL` is required and must differ from `DATABASE_URL`. Each e2e
spec creates a Postgres schema of its own and drops it afterwards; the specs
truncate what they touch, so pointing them at a database you care about would
be destructive — hence no default.

`npm run typecheck` is separate from `npm run build` on purpose: ts-jest runs
with `isolatedModules`, so it transpiles without type-checking and a tree that
does not compile can still show passing tests.

## Operational notes

- `/health` (liveness) and `/health/ready` (readiness, checks the database).
- Notifications go through `NotificationsService`. Without `SMTP_*` set there is
  no transport: messages are recorded in the outbox as `PENDING` and logged, and
  never reported as delivered.
- `BackgroundSchedulerService` sweeps for missed follow-ups and appointments
  every five minutes. Its interval is unref'd and cleared on shutdown.
- Rate limiting buckets anonymous traffic by client address, so set
  `TRUST_PROXY` if the API sits behind a proxy — otherwise every client resolves
  to the proxy and shares one bucket. Avoid `true`: it trusts any
  `X-Forwarded-For`, which a caller can forge to evade limiting entirely.
