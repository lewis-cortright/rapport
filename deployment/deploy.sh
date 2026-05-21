#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# deploy.sh — Rapport Chat production deployment script
#
# Run from the repository root on the DigitalOcean droplet after pulling the
# latest code with `git pull`.  Assumes Node.js ≥ 20 and PM2 are installed.
#
# Usage:
#   chmod +x deployment/deploy.sh
#   ./deployment/deploy.sh
# ---------------------------------------------------------------------------

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIST="$REPO_ROOT/frontend/dist"
SERVE_DIR="/var/www/rapport/frontend"

echo "=== Rapport deploy: $(date -u '+%Y-%m-%dT%H:%M:%SZ') ==="
cd "$REPO_ROOT"

# --- Backend dependencies and build -------------------------------------
echo "[1/5] Installing server dependencies..."
cd server
npm ci --omit=dev
echo "[2/5] Building server..."
npm run build
cd "$REPO_ROOT"

# --- Frontend dependencies and build ------------------------------------
echo "[3/5] Installing frontend dependencies..."
cd frontend
npm ci
echo "[4/5] Building frontend..."
npm run build
cd "$REPO_ROOT"

# --- Copy frontend build to Nginx root ----------------------------------
echo "[5/5] Copying frontend build to $SERVE_DIR..."
mkdir -p "$SERVE_DIR"
# rsync preserves file permissions and only copies changed files.
rsync -a --delete "$FRONTEND_DIST/" "$SERVE_DIR/"

# --- Reload backend process via PM2 ------------------------------------
echo "Reloading PM2 process..."
if pm2 describe rapport > /dev/null 2>&1; then
  pm2 reload rapport --update-env
else
  pm2 start "$REPO_ROOT/deployment/ecosystem.config.cjs" --env production
  pm2 save
fi

# --- Health check -------------------------------------------------------
echo "Running health check..."
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health)
if [ "$STATUS" = "200" ]; then
  echo "Health check passed (HTTP $STATUS). Deployment complete."
else
  echo "WARNING: Health check returned HTTP $STATUS. Check PM2 logs: pm2 logs rapport" >&2
fi

