#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

echo ""
echo "=============================="
echo "  InsureWise — Local Setup"
echo "=============================="
echo ""

# ------------------------------------------------------------------
# 1. Check prerequisites
# ------------------------------------------------------------------
info "Checking prerequisites..."

# Node.js
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install v20.19+ or v22.12+ from https://nodejs.org or via nvm."
  exit 1
fi
NODE_VERSION=$(node -v | sed 's/v//')
info "  Node.js $NODE_VERSION ✓"

# pnpm
if command -v pnpm &>/dev/null; then
  PNPM_CMD="pnpm"
elif npx pnpm --version &>/dev/null 2>&1; then
  PNPM_CMD="npx pnpm"
  warn "  pnpm not found globally — using 'npx pnpm'. Install globally with: npm install -g pnpm"
else
  error "pnpm is not installed. Run: npm install -g pnpm"
  exit 1
fi
info "  pnpm ✓ (using: $PNPM_CMD)"

# PostgreSQL
if ! command -v psql &>/dev/null; then
  error "PostgreSQL is not installed. Install with: brew install postgresql@16 (macOS) or sudo apt install postgresql (Linux)"
  exit 1
fi
info "  PostgreSQL ✓"

# Python
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
  PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
  PYTHON_CMD="python"
fi
if [ -z "$PYTHON_CMD" ]; then
  warn "  Python not found — Moorcheh Knowledge Assistant will not work. Install Python 3.10+."
else
  info "  Python ✓ ($($PYTHON_CMD --version))"
fi

echo ""

# ------------------------------------------------------------------
# 2. Install Node dependencies
# ------------------------------------------------------------------
info "Installing Node dependencies..."
$PNPM_CMD install
echo ""

# ------------------------------------------------------------------
# 3. Set up .env file
# ------------------------------------------------------------------
ENV_FILE="artifacts/api-server/.env"

if [ -f "$ENV_FILE" ]; then
  info ".env file already exists at $ENV_FILE — skipping creation."
else
  DB_USER=$(whoami)
  info "Creating $ENV_FILE..."
  cat > "$ENV_FILE" <<EOF
PORT=3001

# Local Postgres — auto-detected username: $DB_USER
DATABASE_URL=postgresql://$DB_USER@localhost:5432/insurewise

# AI model — GPT-OSS 120B hosted on HuggingFace (OpenAI-compatible API)
OPENAI_API_KEY=test
OPENAI_BASE_URL=https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1
AI_MODEL=openai/gpt-oss-120b

# Moorcheh Python API Key (Knowledge Engine)
# Get yours at https://console.moorcheh.ai/api-keys
MOORCHEH_API_KEY=your_key_here

# To use your own OpenAI account instead, set:
# OPENAI_API_KEY=sk-your-key-here
# OPENAI_BASE_URL=https://api.openai.com/v1
# AI_MODEL=gpt-4o-mini
EOF
  info ".env created with DATABASE_URL using username '$DB_USER'."
fi
echo ""

# ------------------------------------------------------------------
# 4. Create database (if it doesn't exist)
# ------------------------------------------------------------------
info "Setting up PostgreSQL database..."
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw insurewise; then
  info "  Database 'insurewise' already exists — skipping."
else
  info "  Creating database 'insurewise'..."
  if createdb insurewise 2>/dev/null; then
    info "  Database created ✓"
  else
    warn "  Could not create database. You may need to run manually:"
    warn "    sudo -u postgres createuser --superuser \$(whoami)"
    warn "    createdb insurewise"
  fi
fi
echo ""

# ------------------------------------------------------------------
# 5. Push database schema
# ------------------------------------------------------------------
info "Pushing database schema..."
set -a
# shellcheck disable=SC1090
source <(grep -v '^#' "$ENV_FILE" | grep -v '^\s*$')
set +a
$PNPM_CMD --filter @workspace/db run push
echo ""

# ------------------------------------------------------------------
# 6. Install Python dependencies (if Python is available)
# ------------------------------------------------------------------
if [ -n "$PYTHON_CMD" ]; then
  info "Installing Python dependencies..."
  $PYTHON_CMD -m pip install -r artifacts/api-server/src/python-workers/requirements.txt --quiet 2>/dev/null || \
    pip install -r artifacts/api-server/src/python-workers/requirements.txt --quiet 2>/dev/null || \
    warn "Could not install Python deps. Run manually: pip install -r artifacts/api-server/src/python-workers/requirements.txt"
  echo ""
fi

# ------------------------------------------------------------------
# Done!
# ------------------------------------------------------------------
echo ""
echo "=============================="
echo "  Setup complete!"
echo "=============================="
echo ""
info "To start the app, run:"
echo ""
echo "    pnpm dev"
echo ""
info "Then open http://localhost:5173"
echo ""
info "Optional: seed the Moorcheh knowledge base for the AI expert feature:"
echo "    python scripts/seed-moorcheh.py"
echo ""
