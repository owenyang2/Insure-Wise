# InsureWise

An AI-powered insurance comparison and purchase platform. Users go through a conversational onboarding flow, get ranked policy recommendations, receive plain-language AI explanations of coverage, and can auto-fill and submit applications — all in one place.

## Features

- **AI Onboarding Chat** — structured question flow that captures your profile with tappable answer chips
- **Policy Comparison** — priority-weighted ranking across 5 auto + 1 home policy (price / coverage / rating sliders)
- **AI Policy Explainer** — plain-language breakdown of what's covered, partially covered, and missing
- **Auto-Fill Applications** — pre-populated forms from your profile data
- **Premium Optimizer** — hyper-specific AI tips to lower your premium (location, credit score, deductible, bundling, etc.)
- **Profile Management** — edit your details and re-run the optimizer at any time

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui |
| State | Zustand (localStorage persisted) |
| Backend | Express 5 (Node.js) |
| Database | PostgreSQL + Drizzle ORM |
| AI | GPT-OSS 120B (OpenAI-compatible API) |
| Monorepo | pnpm workspaces |

---

## Running Locally

### Prerequisites

- **Node.js** v18 or later
- **pnpm** v9 or later — install with `npm install -g pnpm`
- **PostgreSQL** — a local instance or a hosted connection string (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com))
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd insurewise
pnpm install
```

### 2. Set up environment variables

Create two `.env` files:

**`artifacts/api-server/.env`**
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/insurewise

# AI model — GPT-OSS 120B hosted on HuggingFace (OpenAI-compatible API)
# No key required for the open hackathon server; set "test" or any value.
OPENAI_API_KEY=test
OPENAI_BASE_URL=https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1
AI_MODEL=openai/gpt-oss-120b

# To use your own OpenAI account instead, set:
# OPENAI_API_KEY=sk-your-key-here
# OPENAI_BASE_URL=https://api.openai.com/v1
# AI_MODEL=gpt-4o-mini
```

**`artifacts/insurewise/.env`**
```env
PORT=5173
BASE_PATH=/
API_PORT=3001
```

### 3. Set up the database

```bash
pnpm --filter @workspace/db run push
```

This pushes the schema (users, conversations, messages tables) to your PostgreSQL instance.

### 4. Start both servers

Open two terminals:

**Terminal 1 — API server:**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/insurewise run dev
```

Then open [http://localhost:5173](http://localhost:5173).

The frontend proxies all `/api/*` requests to the API server on port 3001 automatically.

### Running both with one command

Install `concurrently` if you want a single command:

```bash
npm install -g concurrently
concurrently \
  "pnpm --filter @workspace/api-server run dev" \
  "pnpm --filter @workspace/insurewise run dev"
```

---

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express REST API
│   │   └── src/
│   │       ├── routes/      # users.ts, insurance.ts, ai.ts
│   │       └── lib/         # mockPolicies.ts — mock data + scoring engine
│   └── insurewise/          # React + Vite frontend
│       └── src/
│           ├── pages/       # Home, Onboarding, Compare, PolicyDetail,
│           │                #   Apply, Confirmation, Profile, Optimizer
│           ├── components/  # Navbar, UI components
│           └── store/       # Zustand global state
├── lib/
│   ├── api-spec/            # OpenAPI spec (openapi.yaml) + Orval codegen
│   ├── api-client-react/    # Auto-generated React Query hooks
│   ├── api-zod/             # Auto-generated Zod schemas
│   ├── db/                  # Drizzle ORM schema + connection
│   └── integrations-anthropic-ai/  # Anthropic client wrapper
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Health check |
| GET | `/api/users/profile` | Get user profile (session-based) |
| PUT | `/api/users/profile` | Create or update user profile |
| POST | `/api/insurance/search` | Search and rank policies |
| POST | `/api/insurance/policies/:id/explain` | AI policy analysis |
| POST | `/api/insurance/policies/:id/application` | Get pre-filled application |
| POST | `/api/insurance/applications/submit` | Submit application |
| POST | `/api/insurance/optimize-profile` | AI premium optimization tips |
| POST | `/api/ai/chat` | Conversational onboarding AI |

---

## Regenerating API Types

If you change `lib/api-spec/openapi.yaml`, regenerate the client:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Notes

- **Session identity** is managed via the `x-session-id` request header. The frontend assigns a UUID per browser session stored in localStorage.
- **Policy data** is mocked in `artifacts/api-server/src/lib/mockPolicies.ts` — 5 auto policies and 1 home policy with full coverage maps and scoring logic.
- **The Optimizer and Policy Explainer** both make live calls to Claude Haiku, so they require a valid Anthropic API key even in development.
