#!/bin/bash
# Emergency repair when production code cannot read from DB (login/bookings Prisma P2022).
# Applies all tracked raw SQL patches via the db container, then verifies schema.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${DB_NAME:-$(grep -m1 '^DB_NAME=' .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")}"

DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep 'bika-banquet-db' | head -1)
if [ -z "$DB_CONTAINER" ]; then
  echo "ERROR: bika-banquet-db container not found"
  exit 1
fi

psql_cmd() {
  docker exec -i "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" "$@"
}

bash scripts/apply-raw-migrations.sh

if ! bash scripts/verify-db-schema.sh; then
  echo ""
  echo "==> Schema still incomplete — force re-applying all SQL files (idempotent)"
  bash scripts/force-raw-migrations.sh
  bash scripts/verify-db-schema.sh
fi

echo ""
echo "==> Ensure all users remain active"
psql_cmd -c 'UPDATE "users" SET "isActive" = true WHERE "isActive" IS DISTINCT FROM true;'

echo ""
echo "==> Backfill hasAllVenueAccess for unrestricted users (safe re-run)"
psql_cmd -c '
UPDATE "users"
SET "hasAllVenueAccess" = true
WHERE "id" NOT IN (SELECT DISTINCT "userId" FROM "user_banquets")
  AND "hasAllVenueAccess" IS DISTINCT FROM true;
'

echo ""
echo "==> Restart server container"
docker compose restart server
sleep 5

echo ""
echo "==> Test login endpoint (expect Invalid credentials, NOT Login failed)"
RESP=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"schema-check@invalid.local","password":"x"}' || true)
echo "Response: $RESP"
if echo "$RESP" | grep -q 'Invalid credentials'; then
  echo "OK: login handler is working (schema matches code)"
elif echo "$RESP" | grep -q 'Login failed'; then
  echo "ERROR: still broken — check server logs:"
  docker compose logs --tail=30 server
  exit 1
else
  echo "Unexpected response — inspect manually"
fi

echo ""
echo "Done. Try logging in and loading bookings at https://banquet.bikafood.com"
