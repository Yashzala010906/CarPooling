# Carpooling Platform

Enterprise carpooling platform — employees of registered organizations can **find rides**, **offer rides**, track trips live, chat, and pay through a wallet. Built as a Turborepo monorepo, architecture-only starter: module boundaries, contracts, and infrastructure are in place; business logic is intentionally left as `TODO`s.

## Tech Stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, Zustand       |
| Backend  | NestJS, JWT auth (Passport), Socket.IO                                     |
| Database | PostgreSQL + Prisma ORM                                                    |
| Realtime | Socket.IO (trip tracking, chat, notifications)                             |
| Payments | Razorpay **Test Mode** (placeholder)                                       |
| Maps     | Google Maps (placeholder — `MapContainer` renders a stub)                  |
| Tooling  | Turborepo, ESLint 9, Prettier, Husky + lint-staged, GitHub Actions, Docker |

## Repository Layout

```
carpooling-platform/
├── apps/
│   ├── web/                  # Next.js 15 app (routes, stores, api services)
│   │   └── src/
│   │       ├── app/          # (auth) login/register · (main) dashboard, rides,
│   │       │                 # trips, vehicles, wallet, payments, history, chat,
│   │       │                 # notifications, reports, settings, admin
│   │       ├── components/   # app-specific components (AppShell, forms…)
│   │       ├── lib/api/      # axios client + per-module service layer
│   │       ├── lib/maps/     # Google Maps loader (placeholder)
│   │       ├── stores/       # Zustand: auth, ride, trip, notification, ui
│   │       └── hooks/
│   └── api/                  # NestJS service
│       └── src/
│           ├── config/       # typed env configuration
│           ├── common/       # guards, decorators, filters, interceptors, dto
│           ├── prisma/       # PrismaService (Nest lifecycle)
│           └── modules/      # auth · users · company · vehicle · ride · booking
│                             # trip · wallet · payment · chat · notification · reports
├── packages/
│   ├── database/             # Prisma schema, client singleton, seed
│   ├── types/                # shared TS types: entities, enums, DTOs, socket events
│   ├── ui/                   # shadcn-style components: Button, Card, Modal, Input,
│   │                         # Navbar, Sidebar, MapContainer
│   ├── eslint-config/        # shared flat configs (base / nest / react)
│   └── typescript-config/    # shared tsconfigs (base / nextjs / nestjs / react-library)
├── docker-compose.yml        # postgres + api + web
└── .github/workflows/ci.yml  # lint · typecheck · build · prisma validate
```

### Architecture principles

- **Clean Architecture:** controllers (delivery) → services (use cases) → Prisma (data). Cross-cutting concerns live in `apps/api/src/common`. Frontend mirrors this: pages → services (`lib/api`) → stores.
- **SOLID:** one module per bounded context; modules communicate through exported services, never each other's repositories. Shared contracts live in `@carpool/types` so web and api cannot drift.
- **Absolute imports:** `@/*` in both apps; workspace packages via `@carpool/*`.

## Getting Started

Prerequisites: Node.js ≥ 20, Docker (for Postgres), npm.

```bash
# 1. Install
npm install

# 2. Environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env

# 3. Database
docker compose up -d postgres
npm run db:generate
npm run db:migrate        # creates the initial migration

# 4. Develop (web on :3000, api on :4000)
npm run dev
```

Useful scripts (run from the repo root):

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | All apps in watch mode via Turborepo |
| `npm run build`     | Build everything                     |
| `npm run lint`      | ESLint across the repo               |
| `npm run typecheck` | `tsc --noEmit` across the repo       |
| `npm run db:studio` | Prisma Studio                        |
| `npm run format`    | Prettier write                       |

Full stack via Docker: `docker compose up --build`.

## Working Agreement for the Team (3 devs)

Each developer owns a vertical slice end-to-end (API module + web pages + services + stores). Ownership is codified in `.github/CODEOWNERS`.

| Dev   | Domain                    | API modules                                    | Web routes                                                 |
| ----- | ------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **A** | Identity & Org            | `auth`, `users`, `company`                     | `/login`, `/register`, `/profile`, `/admin/*`, `/settings` |
| **B** | Ride Lifecycle & Realtime | `ride`, `booking`, `trip`, `chat`              | `/rides/*`, `/trips/*`, `/chat`, `/history`                |
| **C** | Money & Insights          | `wallet`, `payment`, `reports`, `notification` | `/wallet`, `/payments`, `/reports`, `/notifications`       |

Shared surfaces — `packages/database/prisma/schema.prisma`, `packages/types`, `packages/ui` — require review from all three before merging.

Suggested flow: trunk-based with short-lived branches (`feat/<area>-<thing>`), PRs gated by CI (lint + typecheck + build) and pre-commit hooks (Prettier via lint-staged).

## Functional Scope (from the problem statement)

Mandatory: authentication, ride discovery, ride publishing, route confirmation, booking, trip management, **live trip tracking**, vehicle management, payments & wallet, ride history, reports dashboard.
Bonus: notifications, ride cancellation, intelligent matching, route optimization, enhanced analytics.

Trip lifecycle: `BOOKED → STARTED → IN_PROGRESS → COMPLETED → PAYMENT_PENDING → PAYMENT_COMPLETED` (see `TripStatus` in `@carpool/types` and the Prisma schema).

## Placeholders to Wire Up

| Integration | Where                                                                  | Notes                                                                   |
| ----------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Google Maps | `apps/web/src/lib/maps/google-maps.ts`, `packages/ui` → `MapContainer` | Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; keep `MapContainer` props stable |
| Razorpay    | `apps/api/src/modules/payment/razorpay.provider.ts`                    | Test mode only (`rzp_test_*` keys)                                      |
| Socket auth | `apps/api` gateways + `apps/web/src/lib/socket.ts`                     | Pass JWT in the handshake                                               |
| Auth guard  | `apps/web/src/middleware.ts`, `apps/api/src/modules/auth`              | Token issuing, refresh, cookie handling                                 |
