# syntax=docker/dockerfile:1

# ---- build ----
FROM node:24-slim AS build
WORKDIR /app

# openssl is required by Prisma's query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Don't run as root.
RUN useradd --system --uid 1001 --create-home gcoms

COPY --from=build --chown=gcoms:gcoms /app/node_modules ./node_modules
COPY --from=build --chown=gcoms:gcoms /app/dist ./dist
COPY --from=build --chown=gcoms:gcoms /app/prisma ./prisma
COPY --from=build --chown=gcoms:gcoms /app/package.json ./package.json

USER gcoms
EXPOSE 3001

# Matches the readiness probe in src/health/health.controller.ts. The port comes
# from the environment rather than the 3001 above, because a platform that
# assigns the port (Railway, Cloud Run, Heroku) sets PORT and the app follows it
# — a probe hardcoded to 3001 would then report a healthy service as sick.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const p=process.env.PORT||3001;fetch('http://127.0.0.1:'+p+'/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# NOTE: JWT_SECRET and ALLOWED_ORIGINS are required — the app refuses to start
# in production without them (see src/config/env.validation.ts). Migrations are
# deliberately not run here; run `npm run db:migrate` as a release step so a
# rolling deploy doesn't have several instances migrating at once. That release
# step is why `prisma` is a runtime dependency and not a dev one: the prune
# above would otherwise leave this image without the CLI the step invokes.
# src/config/production-image.spec.ts holds that property.
CMD ["node", "dist/main"]
