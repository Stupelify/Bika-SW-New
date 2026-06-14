#!/bin/bash
set -euo pipefail

# Bika Banquet — Production Deploy Script
# Usage: ./scripts/deploy.sh [--skip-build] [--skip-backup]
#
# Handles: code pull, DB backup, build, Prisma migrations,
#          raw SQL patches, nginx-proxy DNS refresh, health verification.

cd "$(dirname "$0")/.."

SKIP_BUILD=false
SKIP_BACKUP=false
for arg in "$@"; do
    case "$arg" in
        --skip-build)  SKIP_BUILD=true ;;
        --skip-backup) SKIP_BACKUP=true ;;
    esac
done

COMPOSE="docker-compose"
DB_CONTAINER="$($COMPOSE ps -q db 2>/dev/null || echo "")"
SERVER_CONTAINER_NAME="bika-banquet-server-1"

fail() { echo "DEPLOY FAILED: $1"; exit 1; }

echo "=== Bika Banquet Deploy ==="
echo ""

# ── Step 1: Pull latest code ──
if [ -d .git ]; then
    echo "[1/7] Pulling latest code..."
    git pull --ff-only || fail "git pull failed — resolve conflicts first"
else
    echo "[1/7] Not a git repo, skipping pull"
fi

# ── Step 2: Backup database before anything destructive ──
if [ "$SKIP_BACKUP" = true ]; then
    echo "[2/7] Skipping backup (--skip-backup)"
else
    echo "[2/7] Backing up database..."
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/pre-deploy-$TIMESTAMP.sql.gz"

    if [ -n "$DB_CONTAINER" ]; then
        $COMPOSE exec -T db pg_dump -U postgres bika_banquet_v2 | gzip > "$BACKUP_FILE" \
            && echo "       Saved: $BACKUP_FILE" \
            || echo "       WARNING: backup failed — continuing anyway"
    else
        echo "       WARNING: DB container not running, skipping backup"
    fi
fi

# ── Step 3: Build images (before stopping old containers) ──
if [ "$SKIP_BUILD" = true ]; then
    echo "[3/7] Skipping build (--skip-build)"
else
    echo "[3/7] Building images..."
    # Build first, THEN recreate — minimizes downtime.
    # docker-compose build doesn't stop running containers.
    $COMPOSE build || fail "Docker build failed"
fi

# ── Step 4: Start/recreate containers ──
echo "[4/7] Starting containers..."
$COMPOSE up -d || fail "docker-compose up failed"

# Wait for DB to be healthy before running migrations
echo "       Waiting for database..."
DB_WAIT=0
while [ $DB_WAIT -lt 60 ]; do
    if $COMPOSE exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        break
    fi
    sleep 2
    DB_WAIT=$((DB_WAIT + 2))
done
[ $DB_WAIT -ge 60 ] && fail "Database did not become ready within 60s"
echo "       Database ready"

# ── Step 5: Run database migrations ──
echo "[5/7] Running database migrations..."

# 5a. Prisma migrate deploy (idempotent — only applies pending migrations)
echo "       Prisma migrations..."
$COMPOSE exec -T server npx prisma migrate deploy 2>&1 \
    && echo "       Prisma migrations applied" \
    || echo "       WARNING: prisma migrate deploy failed (may be OK if using raw SQL only)"

# 5b. Raw SQL patches via db container (server image has no psql)
echo "       Raw SQL patches..."
bash scripts/apply-raw-migrations.sh \
    && echo "       Raw SQL patches applied" \
    || fail "raw SQL patches failed — run ./scripts/fix-db-schema.sh"

echo "       Verifying DB schema..."
if ! bash scripts/verify-db-schema.sh; then
  echo "       Schema incomplete — force re-applying SQL..."
  bash scripts/force-raw-migrations.sh
  bash scripts/verify-db-schema.sh \
    || fail "DB schema incomplete — run ./scripts/fix-db-schema.sh"
fi

# 5c. Regenerate Prisma client (in case schema changed)
echo "       Regenerating Prisma client..."
$COMPOSE exec -T server npx prisma generate 2>&1 || true

# ── Step 6: Wait for server health ──
echo "[6/7] Waiting for server to be healthy..."
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    SERVER_HEALTH=$($COMPOSE exec -T server curl -sf http://localhost:5000/health 2>/dev/null || echo "")
    if echo "$SERVER_HEALTH" | grep -q '"status":"ok"'; then
        echo "       Server healthy after ${ELAPSED}s"
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "WARNING: Server not healthy after ${MAX_WAIT}s"
    echo "         Logs: $COMPOSE logs --tail=50 server"
    echo ""
    echo "         To rollback DB:"
    echo "         gunzip -c $BACKUP_FILE | $COMPOSE exec -T db psql -U postgres bika_banquet_v2"
    exit 1
fi

# ── Step 7: Restart nginx-proxy + verify ──
echo "[7/7] Refreshing nginx-proxy & verifying..."

# Restart nginx-proxy so it re-resolves container IPs
if docker ps --format '{{.Names}}' | grep -q '^nginx-proxy$'; then
    docker restart nginx-proxy >/dev/null
    echo "       nginx-proxy restarted"
else
    echo "       nginx-proxy not found, skipping"
fi

sleep 3

# Verify through full HTTPS path
API_OK=false
CLIENT_OK=false

API_CHECK=$(docker exec nginx-proxy curl -sk https://localhost/api/health -H "Host: banquet.bikafood.com" 2>/dev/null || echo "FAIL")
CLIENT_CHECK=$(docker exec nginx-proxy curl -sk https://localhost/ -H "Host: banquet.bikafood.com" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "FAIL")

echo "$API_CHECK" | grep -q '"status":"ok"' && API_OK=true
[ "$CLIENT_CHECK" = "200" ] && CLIENT_OK=true

echo ""
if $API_OK && $CLIENT_OK; then
    echo "=== Deploy SUCCESS ==="
else
    echo "=== Deploy PARTIAL ==="
fi
echo "    API:    $( $API_OK && echo 'OK' || echo "FAILED — $API_CHECK" )"
echo "    Client: $( $CLIENT_OK && echo 'OK' || echo "FAILED (HTTP $CLIENT_CHECK)" )"
echo ""
echo "    Site: https://banquet.bikafood.com"
echo "    Logs: $COMPOSE logs -f"

if ! $API_OK || ! $CLIENT_OK; then
    echo ""
    echo "    Rollback DB if needed:"
    echo "    gunzip -c backups/pre-deploy-*.sql.gz | $COMPOSE exec -T db psql -U postgres bika_banquet_v2"
    exit 1
fi
