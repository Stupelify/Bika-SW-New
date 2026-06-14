#!/bin/bash
# Production deploy steps used by GitHub Actions (self-hosted runner on VPS).
# Idempotent — safe to re-run.
set -euo pipefail

APP_DIR="${APP_DIR:-/root/bika-banquet-v2/bika-banquet}"
cd "$APP_DIR"

DB_NAME="$(grep -m1 '^DB_NAME=' .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")"

echo "==> Pulling latest code"
git fetch origin
git reset --hard origin/master

echo "==> Applying tracked SQL patches"
bash scripts/apply-raw-migrations.sh

echo "==> Verify DB schema before rebuild"
if ! bash scripts/verify-db-schema.sh; then
  echo "==> Schema incomplete after tracked migrations — force re-applying SQL"
  bash scripts/force-raw-migrations.sh
  bash scripts/verify-db-schema.sh
fi

echo "==> Building images (BuildKit cache enabled)"
DOCKER_BUILDKIT=1 docker compose build --parallel

echo "==> Recreating app containers (non-destructive)"
docker compose up -d --no-deps --force-recreate server client nginx

echo "==> Ensure all services up (no double-recreate)"
docker compose up -d --no-recreate

echo "==> Refreshing nginx-proxy (re-resolves container IPs after recreate)"
if docker ps --format '{{.Names}}' | grep -q '^nginx-proxy$'; then
  docker restart nginx-proxy
  echo "  nginx-proxy restarted"
else
  echo "  nginx-proxy not found, skipping"
fi

echo "==> Health check (up to 90s)"
healthy=0
for i in $(seq 1 18); do
  if docker compose exec -T server curl -fs http://localhost:5000/health >/dev/null 2>&1; then
    echo "Server healthy after $((i * 5))s"
    healthy=1
    break
  fi
  echo "Waiting... ($i/18)"
  sleep 5
done

if [ "$healthy" -eq 0 ]; then
  echo "ERROR: Server failed health check after 90s"
  docker compose logs --tail=50 server
  exit 1
fi

echo "==> Renewing SSL certificate if due"
if [ -x scripts/renew-ssl.sh ]; then
  ./scripts/renew-ssl.sh || echo "WARNING: SSL renewal failed — check certbot logs"
fi

docker compose ps
echo "==> Deploy SUCCESS"
