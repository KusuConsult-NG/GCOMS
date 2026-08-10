# GCOMS — web

The browser client: Next.js 16 (App Router), React 19, Tailwind 4, zustand for
session state, axios for the API. It is a PWA — installable, with a service
worker — because it is used on phones in LGAs where a connection is not a given.

See the [repository README](../../README.md) for the stack as a whole, and
`.env.example` for configuration.

```bash
npm ci
npm run dev          # :3000, expects the API on :3001
```

## How it is put together

Almost everything is a client component. Forty-three of the forty-four fetch
from the API after hydration, so the server render is an empty shell — which is
why static export is possible at all, and why the root layout's only
server-side act is reading the CSP nonce out of the request.

- `src/app/(auth)/login` — the sign-in page.
- `src/app/(dashboard)` — twenty-five routes behind `ClientAuthWrapper`, which
  gates on the persisted token. Authorisation is the API's job; these gates
  decide what to render, not what is permitted.
- `src/components/workspaces` — one workspace per role family. `(dashboard)/page.tsx`
  picks between them; the executive workspace is the default.
- `src/components/navigation.ts` — the sidebar and topbar are rendered from this
  one structure, sharing a role predicate so they cannot disagree about what a
  given role can see.
- `src/lib/offlineQueue.ts` — field registrations captured while the API is
  unreachable, encrypted at rest (`secureStore.ts`), replayed with an
  idempotency key so a retry cannot register a patient twice, and attributed to
  whoever captured them rather than whoever is signed in when they sync.
- `src/app/globals.css` — the design tokens. Colours are `var(--primary)` rather
  than hex so both themes come from one file; a screen written with tokens gets
  dark mode for free.

## Security

- `src/proxy.ts` sets a per-request CSP nonce. `src/lib/csp.ts` holds the
  directives, shared with the weaker static-export policy so the two cannot
  drift.
- `next.config.ts` sets the fixed security headers.
- The login page's demo-account shortcuts are gated on `NODE_ENV` and
  dead-code-eliminated from production builds. CI asserts they are absent from
  the shipped bundle — including the addresses on their own, since a refactor
  could drop the heading and keep the buttons.

## Checks

```bash
npm run lint                  # errors fail; 31 warnings are known, see eslint.config.mjs
npx tsc --noEmit
npm run build
npm run verify:ui -- /tmp/out # every route, every role, both themes, in a browser
npm run icons                 # regenerate the PWA icons from the logo
```

`verify:ui` needs the API running against a seeded database. It fails the build
on any uncaught exception or CSP violation and writes a screenshot per
route/role, which is how you see what a broken page actually looked like.

## Static export

`NEXT_PUBLIC_STATIC_EXPORT=true npm run build` produces `out/` for a host that
runs no server code. It is used by the GitHub Pages workflow. Read the
deployment section of the repository README before choosing it: the export
cannot set response headers and has no CSP nonce, and those are not
recoverable on a static host.
