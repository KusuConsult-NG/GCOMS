# GCOMS

**GEORGEL Community Outreach Management System** — the operational record for a
cancer outreach programme in Plateau State, Nigeria. It covers patient
registration and screening in the field, clinical follow-up and referral, and
the finance, HR, procurement, grant and governance work behind the programme,
under one set of accounts and one audit trail.

Twenty roles, twenty-five screens, fifty-seven tables. Field devices are phones
with intermittent connectivity, so volunteer registrations are captured offline
and replayed when a connection returns.

## What is here

```
apps/api    NestJS 11 + Prisma + PostgreSQL 16   — the API and the database schema
apps/web    Next.js 16 (App Router) + React 19   — the browser client, a PWA
```

Each app is a self-contained npm project with its own lockfile. There is no
workspace root; install in each directory.

## Running it

### With Docker

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
docker compose up --build
```

Postgres comes up first, a one-shot `migrate` service applies the schema, then
the API on **:3001** and the web app on **:3000**. `JWT_SECRET` has no default:
the API refuses to start without one.

### Locally

Postgres must be reachable — `docker compose up db` is enough for just the
database.

```bash
# API
cd apps/api
cp .env.example .env         # then set JWT_SECRET and DATABASE_URL
npm ci
npx prisma generate
npm run db:migrate
npm run db:seed              # optional; see below
npm run start:dev            # :3001

# web
cd apps/web
cp .env.example .env.local
npm ci
npm run dev                  # :3000
```

`npm run db:seed` creates one account per role (`executive@gcoms.org`,
`clinician@gcoms.org`, `volunteer@gcoms.org`, …) plus sample programme data.
They share one password: set `SEED_PASSWORD` to choose it, or leave it unset and
the seed generates one and prints it once. The seed refuses to run when
`NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=yes-i-mean-it` is set,
because it would otherwise create a `SYSTEM_ADMIN` account with a shared
password on a live database.

To stand up a **real** deployment, use `npm run db:bootstrap` instead. It
creates a single `SYSTEM_ADMIN` from `BOOTSTRAP_ADMIN_EMAIL` (and an optional
`BOOTSTRAP_ADMIN_PASSWORD`, generated and printed once if you omit it), no demo
records, and does nothing at all if the database already has accounts — so it is
safe to leave wired in as a deploy step. Without it a new deployment has an
empty `User` table and no sign-up route, which is a login page that nothing can
sign into.

Configuration is documented in `apps/api/.env.example` and
`apps/web/.env.example`. The API validates its environment at boot
(`src/config/env.validation.ts`) and will not start with a missing or
placeholder `JWT_SECRET`.

## Tests

```bash
cd apps/api
npx eslint "src/**/*.ts" --max-warnings 0
npm run typecheck
npx jest                                      # 190 unit
TEST_DATABASE_URL=... npx jest --config ./test/jest-e2e.json   # 41 end-to-end
```

`TEST_DATABASE_URL` is required rather than defaulted, and must differ from
`DATABASE_URL`. The e2e specs create and drop a Postgres schema per run; a
default would eventually be someone's development database.

```bash
cd apps/web
npx eslint src --max-warnings 31   # the 31 are explained in eslint.config.mjs
npx tsc --noEmit
npm run verify:ui -- /tmp/gcoms-ui # drives every route and role in a browser
```

`verify:ui` needs both apps running and a seeded database. It signs in as each
of the thirteen roles, visits all twenty-five routes in both themes, and fails
on any uncaught exception or CSP violation.

CI runs all of the above plus a Docker image build on every pull request, and
can be run on demand from the Actions tab.

## Deployment

### The default: a Next server

The web app expects to run as a Next server (`next start`). Two protections
depend on that and cannot be had any other way:

- `src/proxy.ts` sets a **per-request CSP nonce**, which is what lets
  `script-src` refuse inline scripts outright.
- `next.config.ts` sets `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` and `Strict-Transport-Security`.

The API is stateless; run migrations as a release step (`npm run db:migrate`),
not at boot, so a rolling deploy does not have several instances migrating at
once. `/health` and `/health/ready` are the liveness and readiness probes.

### Railway (API and Postgres)

`apps/api/railway.json` is the service configuration: it builds the existing
Dockerfile, runs `npm run db:migrate` as a pre-deploy step, and gates the
release on `GET /health/ready` rather than on the process merely starting.

Create the service with **Root Directory** set to `apps/api` — that is where the
Dockerfile, the lockfile and `railway.json` live — then add a Postgres database
to the same project.

Variables to set on the API service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — a reference, so it follows the database |
| `JWT_SECRET` | `openssl rand -base64 48`. Startup aborts without it |
| `ALLOWED_ORIGINS` | the web app's origin, e.g. `https://kusuconsult-ng.github.io` — scheme and host only, no path |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `UPLOAD_DIR` | the mount path of a volume, e.g. `/var/lib/gcoms/documents` |

`PORT` is assigned by the platform and read from the environment; don't set it.

Two of those are easy to skip and expensive to skip:

- **`TRUST_PROXY=1`.** Every request arrives through Railway's edge, so without
  it every client resolves to the same address and shares one rate-limit
  bucket — five failed logins from anyone locks out everyone. Set it to the hop
  count, not `true`, which would trust a forged `X-Forwarded-For`.
- **A volume for `UPLOAD_DIR`.** The container filesystem is ephemeral. Uploaded
  documents written beside the app disappear on the next deploy while their
  `DocumentRecord` rows survive, so the register goes on listing files that are
  no longer there.

Then create the first administrator, once:

```bash
railway run --service api npm run db:bootstrap   # with BOOTSTRAP_ADMIN_EMAIL set
```

Finally, take the service's public URL, set it as the repository variable
`NEXT_PUBLIC_API_URL` (Settings → Secrets and variables → Actions → Variables),
and re-run the Pages workflow. The two must agree in both directions: the Pages
origin has to appear in `ALLOWED_ORIGINS` or the browser blocks every call.

**Region.** Railway has no African region, so patient records sit in whichever
region the service is created in — `europe-west4` (Amsterdam) is the closest.
That makes this a cross-border transfer of health data out of Nigeria, which
needs a lawful basis under the NDPA. Worth confirming with counsel rather than
assuming; `af-south-1` on another provider avoids the question entirely.

### GitHub Pages (web only)

`.github/workflows/pages.yml` publishes a static export of the web app. Pages
serves files and runs nothing, so **the API and Postgres must be hosted
elsewhere** — without an API the site is a sign-in page that cannot sign anyone
in. Set the repository variable `NEXT_PUBLIC_API_URL` to the public HTTPS URL of
the API; the workflow fails with an explanation rather than deploying a site
that cannot work. Add the Pages origin to the API's `ALLOWED_ORIGINS`.

Know what the static build gives up. It cannot set response headers, so all five
headers above are gone, and its CSP moves into a `<meta>` tag — which browsers
ignore `frame-ancestors` in, and which has no nonce, so `script-src` falls back
to `'unsafe-inline'`. For a system holding patient records this is a real
downgrade, and it is the reason the Next-server deployment remains the default.
See `apps/web/src/lib/csp.ts`.

Set `PAGES_BASE_PATH` to `/` if the site is served from a custom domain rather
than `<user>.github.io/<repo>`.

## Notes

- `apps/web/public/georgel-logo.png` is a JPEG despite the extension. Browsers
  sniff the content type so it renders, but anything reading it by extension
  needs to know — see `scripts/generate-icons.mjs`, which declares it correctly.
- The PWA icons are generated from that logo by `npm run icons`, not drawn by
  hand. The script isolates the ribbon from the horizontal lockup, which is
  illegible at 192px.
