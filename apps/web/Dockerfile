# syntax=docker/dockerfile:1

# ---- build ----
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined at build time, not read at runtime, so the
# API URL has to be supplied here rather than as a container env var.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# `.next/cache` is webpack's build cache, not build output: it holds the original
# source of every module, so copying it into the runtime image ships the whole
# frontend source — including the demo shortcuts the bundle is careful to strip —
# inside the container. `next start` never reads it.
RUN rm -rf .next/cache

# ---- runtime ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN useradd --system --uid 1001 --create-home gcoms

COPY --from=build --chown=gcoms:gcoms /app/node_modules ./node_modules
COPY --from=build --chown=gcoms:gcoms /app/.next ./.next
COPY --from=build --chown=gcoms:gcoms /app/public ./public
COPY --from=build --chown=gcoms:gcoms /app/package.json ./package.json

USER gcoms
EXPOSE 3000

CMD ["npm", "run", "start"]
