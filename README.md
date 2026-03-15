
# InsureWise

InsureWise is an AI-powered insurance comparison and recommendation platform. Users go through a conversational onboarding flow, get ranked policy recommendations, and receive plain-language AI explanations of coverage. The platform helps users find and prepare to apply for the best-fit insurance options.

## Features

- **AI Onboarding Chat** — Structured question flow that captures your profile with tappable answer chips
- **Dual AI Engine Routing**:
  - **OpenAI Parser (Form Extraction):** Parses your conversational text to extract structured JSON form answers using GPT-OSS 120B.
  - **Moorcheh Knowledge Assistant (RAG):** A Python-based semantic memory engine that acts as a sidebar expert. If you ask a question during onboarding (e.g. "What does comprehensive cover?"), the request is routed to the Moorcheh SDK worker to pull factual data from the seeded knowledge base.
  - **Manual UI Override:** A segmented control toggle on the chat screen lets you force the bot into "Auto", "Moorcheh Expert", or "OpenAI Parser" modes.
- **Policy Comparison** — Priority-weighted ranking across 3 policies (price, coverage, and rating sliders)
- **AI Policy Explainer** — Plain-language breakdown of what's covered, partially covered, and missing
- **Premium Optimizer** — AI tips to lower your premium (location, credit score, deductible, bundling, etc.)
- **Profile Management** — Edit your details and re-run the optimizer at any time

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

---

## Running Locally

### Prerequisites

- **Node.js** v20.19+ or v22.12+ (required by Vite). Check with `node -v`. If needed, use [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`.
- **pnpm** v9+ — install with `npm install -g pnpm`, or use `npx pnpm` in place of `pnpm` for every command below.
- **PostgreSQL** — local (see below) or a hosted DB (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com)).
- **Python 3.10+** - required to run the Moorcheh SDK backend workers.
- **Moorcheh API Key** — mandatory for the Insurance Knowledge Assistant RAG workflows. Get one at [console.moorcheh.ai](https://console.moorcheh.ai/api-keys).

### 1. Clone and install

```bash
git clone https://github.com/owenyang2/InsureWise.git
cd InsureWise
pnpm install
```

(If `pnpm` is not found, use `npx pnpm install` instead.)

### 2. Set up environment variables

Create two `.env` files. The frontend dev script sets `PORT`/`BASE_PATH`/`API_PORT` by default, so the frontend `.env` is optional.

**`artifacts/api-server/.env`**
```env
PORT=3001
# Local Postgres — replace YOUR_USERNAME with your Mac/Linux username (run: whoami)
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/insurewise

# AI model — GPT-OSS 120B hosted on HuggingFace (OpenAI-compatible API)
# No key required for the open hackathon server; set "test" or any value.
OPENAI_API_KEY=test
OPENAI_BASE_URL=https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1
AI_MODEL=openai/gpt-oss-120b

# Moorcheh Python API Key (Knowledge Engine)
MOORCHEH_API_KEY=your_key_here

# To use your own OpenAI account instead, set:
# OPENAI_API_KEY=sk-your-key-here
# OPENAI_BASE_URL=https://api.openai.com/v1
# AI_MODEL=gpt-4o-mini
```

**`artifacts/insurewise/.env`** (optional — dev script has defaults)
```env
PORT=5173
BASE_PATH=/
API_PORT=3001
```

### 3. Set up PostgreSQL (local)

**Install and start (macOS with Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Create the database:**
```bash
createdb insurewise
```

**Point the app at it:** in `artifacts/api-server/.env`, set `DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/insurewise` (replace `YOUR_USERNAME` with the output of `whoami`).

### 4. Push the database schema

`DATABASE_URL` must be set when running this (e.g. from your api-server `.env`):

```bash
export $(grep -v '^#' artifacts/api-server/.env | xargs)
pnpm --filter @workspace/db run push
```

This creates the users, conversations, and messages tables.

### 5. Install Python Dependencies & Seed Moorcheh

Our application uses official Python packages to connect sequentially to the Moorcheh Semantic Memory backend.

```bash
pip install -r artifacts/api-server/src/python-workers/requirements.txt
```

Before running the application, make sure to push the mock insurance knowledge packages to Moorcheh's servers using the seed script (this uses the `MOORCHEH_API_KEY` defined in `api-server/.env`):

```bash
python scripts/seed-moorcheh.py
```

### 5. Start both servers

Open two terminals from the repo root.

**Terminal 1 — API server:**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/insurewise run dev
```

Then open [http://localhost:5173](http://localhost:5173). The frontend proxies `/api/*` to the API server on port 3001.

### Running both with one command

```bash
npx concurrently \
  "pnpm --filter @workspace/api-server run dev" \
  "pnpm --filter @workspace/insurewise run dev"
```

### Troubleshooting

- **`pnpm: command not found`** — Use `npx pnpm` instead of `pnpm`, or run `npm install -g pnpm`.
- **Node version / Vite errors** — Use Node 20.19+ or 22.12+: `nvm install 22 && nvm use 22`.
- **"Cannot find native binding" or missing `@rollup/rollup-darwin-arm64` (and similar)** — The workspace allows Mac binaries; do a clean reinstall: `rm -rf node_modules && pnpm install`.

**Moorcheh (Knowledge Assistant / ask-expert):**
- **API key** — In `artifacts/api-server/.env` set `MOORCHEH_API_KEY` to a valid key from [console.moorcheh.ai](https://console.moorcheh.ai/api-keys). If it’s missing or wrong, the UI will show the error when you use the expert (e.g. "Missing MOORCHEH_API_KEY" or the Moorcheh API message).
- **Python** — The server spawns `python3` to run `artifacts/api-server/src/python-workers/moorcheh.py`. Use Python 3.10+ and install deps: `pip install -r artifacts/api-server/src/python-workers/requirements.txt`.
- **Seed the knowledge base** — Run once (and after changing docs): `python scripts/seed-moorcheh.py`. This creates the `insurewise-knowledge` namespace and uploads the mock insurance docs. If the namespace or docs are missing, answers may be empty or generic.
- **Path** — The API server runs with its working directory as `artifacts/api-server`, so the script path is `src/python-workers/moorcheh.py` relative to that. If you run the server from elsewhere, ensure the worker path is still correct.

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

---

## Regenerating API Types

If you change `lib/api-spec/openapi.yaml`, regenerate the client:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Notes

- **Session identity** is managed via the `x-session-id` request header. The frontend assigns a UUID per browser session stored in localStorage.
- **The Optimizer and Policy Explainer** use the configured AI model (GPT-OSS 120B by default via Hugging Face; override with `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `AI_MODEL` for OpenAI or another OpenAI-compatible endpoint).
- **The Knowledge Assistant** uses the Python `moorcheh-sdk` to execute semantic document retrieval, requiring Python `3.10`+ to be installed locally to successfully spawn the child worker processes locally.
