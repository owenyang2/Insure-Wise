
# InsureWise

InsureWise is an AI-powered insurance comparison and recommendation platform. Users go through a conversational onboarding flow, get ranked policy recommendations, and receive plain-language AI explanations of coverage.

## Quick Start

**Prerequisites:** Node.js 20.19+, pnpm 9+, PostgreSQL running locally, Python 3.10+ (optional, for Moorcheh AI)

### Option A: Automated setup (recommended)

```bash
git clone https://github.com/owenyang2/InsureWise.git
cd InsureWise
pnpm setup        # installs deps, creates .env, sets up DB, pushes schema
pnpm dev           # starts API + frontend in one command
# Open http://localhost:5173
```

### Option B: Manual setup

```bash
git clone https://github.com/owenyang2/InsureWise.git
cd InsureWise
pnpm install
```

Create `artifacts/api-server/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/insurewise
OPENAI_API_KEY=test
OPENAI_BASE_URL=https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1
AI_MODEL=openai/gpt-oss-120b
MOORCHEH_API_KEY=your_key_here
```

> Replace `YOUR_USERNAME` with the output of `whoami`.

```bash
createdb insurewise                                          # create the database
export $(grep -v '^#' artifacts/api-server/.env | xargs)     # load env vars
pnpm db:push                                                 # push schema
pnpm dev                                                     # start the app
# Open http://localhost:5173
```

---

## Available Scripts

| Command | What it does |
|---|---|
| `pnpm setup` | One-time setup: install deps, create `.env`, create DB, push schema |
| `pnpm dev` | Start API server (port 3001) + frontend (port 5173) together |
| `pnpm dev:api` | Start only the API server |
| `pnpm dev:web` | Start only the frontend |
| `pnpm db:push` | Push database schema (requires `DATABASE_URL` env var) |
| `pnpm build` | Type-check and build all packages |

---

## Detailed Setup Guide

### Prerequisites

| Requirement | Version | How to install |
|---|---|---|
| **Node.js** | v20.19+ or v22.12+ | `nvm install 22 && nvm use 22` ([nvm](https://github.com/nvm-sh/nvm)) |
| **pnpm** | v9+ | `npm install -g pnpm` (or use `npx pnpm` everywhere) |
| **PostgreSQL** | 14+ | `brew install postgresql@16 && brew services start postgresql@16` (macOS) |
| **Python** | 3.10+ (optional) | `brew install python` or [python.org](https://www.python.org/downloads/) |
| **Moorcheh API Key** | — (optional) | [console.moorcheh.ai/api-keys](https://console.moorcheh.ai/api-keys) |

### PostgreSQL setup

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb insurewise
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createuser --superuser $(whoami)
createdb insurewise
```

**Or use a hosted DB** like [Neon](https://neon.tech) or [Supabase](https://supabase.com) and set `DATABASE_URL` accordingly.

### Environment variables

**`artifacts/api-server/.env`** (required):

```env
PORT=3001

# Local Postgres — replace YOUR_USERNAME with output of: whoami
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/insurewise

# AI model — GPT-OSS 120B (OpenAI-compatible, no key needed for hackathon server)
OPENAI_API_KEY=test
OPENAI_BASE_URL=https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1
AI_MODEL=openai/gpt-oss-120b

# Moorcheh AI Knowledge Engine (optional — needed for "Ask Expert" feature)
MOORCHEH_API_KEY=your_key_here

# To use your own OpenAI key instead:
# OPENAI_API_KEY=sk-your-key-here
# OPENAI_BASE_URL=https://api.openai.com/v1
# AI_MODEL=gpt-4o-mini
```

**`artifacts/insurewise/.env`** (optional — dev script sets defaults):

```env
PORT=5173
BASE_PATH=/
API_PORT=3001
```

### Push database schema

```bash
export $(grep -v '^#' artifacts/api-server/.env | xargs)
pnpm db:push
```

### Moorcheh Knowledge Base (optional)

```bash
pip install -r artifacts/api-server/src/python-workers/requirements.txt
python scripts/seed-moorcheh.py
```

### Start the app

```bash
pnpm dev
# Open http://localhost:5173
```

The frontend proxies `/api/*` requests to the API server on port 3001.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `pnpm: command not found` | `npm install -g pnpm` or use `npx pnpm` instead |
| Node version / Vite errors | `nvm install 22 && nvm use 22` |
| `Cannot find native binding` | `rm -rf node_modules && pnpm install` |
| `role "xxx" does not exist` (Postgres) | `sudo -u postgres createuser --superuser $(whoami)` |
| Moorcheh API errors | Check `MOORCHEH_API_KEY` in `.env` — get one at [console.moorcheh.ai](https://console.moorcheh.ai/api-keys) |
| `python3: command not found` | Install Python 3.10+; needed for Moorcheh workers |
| Empty Moorcheh answers | Run `python scripts/seed-moorcheh.py` to seed the knowledge base |
| Frontend can't reach API | Ensure API is running on port 3001 before starting frontend |

---

## Features

- **AI Onboarding Chat** — Structured question flow with tappable answer chips
- **Dual AI Engine Routing**:
  - **OpenAI Parser:** Extracts structured form data from conversational text
  - **Moorcheh Knowledge Assistant (RAG):** Semantic search over insurance knowledge base
  - **Manual UI Override:** Toggle between "Auto", "Moorcheh Expert", or "OpenAI Parser" modes
- **Policy Comparison** — Priority-weighted ranking with price, coverage, and rating sliders
- **AI Policy Explainer** — Plain-language coverage breakdown
- **Premium Optimizer** — AI tips to lower your premium
- **Profile Management** — Edit details and re-run optimizer

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui |
| State | Zustand (localStorage persisted) |
| Backend | Express 5 (Node.js) |
| Database | PostgreSQL + Drizzle ORM |
| RAG Engine | Moorcheh AI (via Python `moorcheh-sdk`) |
| AI | GPT-OSS 120B (OpenAI-compatible API) |
| Monorepo | pnpm workspaces |

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express REST API
│   │   └── src/
│   │       ├── routes/      # users.ts, insurance.ts, ai.ts
│   │       ├── lib/         # mockPolicies.ts — mock data + scoring engine
│   │       └── python-workers/  # Moorcheh SDK worker
│   └── insurewise/          # React + Vite frontend
│       └── src/
│           ├── pages/       # Home, Onboarding, Compare, PolicyDetail,
│           │                #   Apply, Confirmation, Profile, Optimizer
│           ├── components/  # Navbar, UI components
│           └── store/       # Zustand global state
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen
│   ├── api-client-react/    # Auto-generated React Query hooks
│   ├── api-zod/             # Auto-generated Zod schemas
│   └── db/                  # Drizzle ORM schema + connection
├── scripts/
│   └── seed-moorcheh.py     # Seed Moorcheh knowledge base
├── setup.sh                 # Automated setup script
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
| POST | `/api/ai/parse-answer` | AI parsing unstructured answers |
| POST | `/api/ai/ask-expert` | Queries Moorcheh Semantic Backend |

## Regenerating API Types

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Notes

- **Session identity** uses `x-session-id` header — the frontend assigns a UUID per browser session in localStorage.
- **AI models** default to GPT-OSS 120B via Hugging Face; override with `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `AI_MODEL`.
- **Knowledge Assistant** requires Python 3.10+ locally to spawn worker processes.
