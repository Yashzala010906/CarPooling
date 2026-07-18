# ── NestJS API ────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g turbo@2
WORKDIR /repo

# Prune the monorepo down to what the api needs
FROM base AS pruner
COPY . .
RUN turbo prune @carpool/api --docker

# Install deps and build
FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN npm ci
COPY --from=pruner /repo/out/full/ .
RUN npm run db:generate --workspace=@carpool/database \
 && npx turbo run build --filter=@carpool/api

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/package.json ./package.json
COPY --from=builder /repo/apps/api/tsconfig.json ./tsconfig.json

EXPOSE 4000
CMD ["npm", "run", "start:prod"]
