# ── Next.js web ───────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g turbo@2
WORKDIR /repo

# Prune the monorepo down to what the web app needs
FROM base AS pruner
COPY . .
RUN turbo prune @carpool/web --docker

# Install deps and build
FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN npm ci
COPY --from=pruner /repo/out/full/ .
RUN npx turbo run build --filter=@carpool/web

# Runtime image (Next standalone output)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
