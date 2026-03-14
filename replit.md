# InsureWise

## Overview

InsureWise is an end-to-end agentic AI platform that helps users find, compare, understand, and purchase insurance — with zero manual re-entry and full policy transparency.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Zustand + Framer Motion
- **Backend**: Express 5 (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Anthropic Claude (via Replit AI Integrations) — claude-haiku-4-5 for chat and policy analysis
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts/
├── api-server/         # Express API server
│   └── src/
│       ├── routes/     # health.ts, users.ts, insurance.ts, ai.ts
│       └── lib/        # mockPolicies.ts (mock policy data + scoring engine)
└── insurewise/         # React + Vite frontend
    └── src/
        ├── pages/      # Home, Onboarding (chat), Compare, PolicyDetail, Apply, Confirmation, Profile
        ├── components/ # Navbar, LoadingAgents, shadcn/ui components
        └── store/      # Zustand global state (use-store.ts)
lib/
├── api-spec/           # OpenAPI spec + Orval codegen config
├── api-client-react/   # Generated React Query hooks
├── api-zod/            # Generated Zod schemas
├── db/                 # Drizzle ORM schema + DB connection
│   └── schema/         # users.ts, conversations.ts, messages.ts
└── integrations-anthropic-ai/  # Anthropic AI client
```

## User Flow (7 Phases)

1. **Landing** (`/`) — Hero, features, CTA
2. **AI Onboarding Chat** (`/onboard`) — Conversational intake via Claude, extracts profile
3. **Policy Comparison** (`/compare`) — Priority-weighted ranked policy cards, live re-ranking
4. **Policy Detail** (`/policy/:id`) — AI analysis, coverage breakdown (covered/partial/gaps)
5. **Application Auto-Fill** (`/apply/:id`) — Pre-filled form from user profile
6. **Confirmation** (`/confirmation`) — Policy number, coverage summary, start date
7. **Profile** (`/profile`) — View/edit saved preferences

## API Endpoints

- `GET /api/healthz` — health check
- `GET /api/users/profile` — get user profile (session-based)
- `PUT /api/users/profile` — upsert user profile
- `POST /api/insurance/search` — search and rank policies
- `POST /api/insurance/policies/:id/explain` — AI policy analysis
- `POST /api/insurance/policies/:id/application` — get pre-filled application form
- `POST /api/insurance/applications/submit` — submit application
- `POST /api/ai/chat` — AI conversation (requirement gathering)

## Database Schema

- `user_profiles` — stores user profile, priorities, requirements, vehicle/property details

## Key Dependencies

### Frontend (`artifacts/insurewise`)
- `@workspace/api-client-react` — generated React Query hooks
- `zustand` — global state (session, chat history, confirmation data)
- `framer-motion` — animations
- `wouter` — client-side routing

### Backend (`artifacts/api-server`)
- `@workspace/db` — Drizzle + PostgreSQL
- `@workspace/api-zod` — Zod validation schemas
- `@workspace/integrations-anthropic-ai` — Anthropic Claude client

## Development Commands

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/insurewise run dev` — frontend
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types
- `pnpm --filter @workspace/db run push` — sync DB schema

## TypeScript & Composite Projects

- `lib/*` packages are composite and emit declarations via `tsc --build`
- Run `pnpm run typecheck` for full project typecheck
- After changing OpenAPI spec, run codegen before building
