#!/bin/bash
# Diagnose and repair DB schema after user-mgmt deploy when login returns
# generic "Login failed" (server Prisma query crash — schema/code mismatch).
set -euo pipefail

cd "$(dirname "$0")/.."

DB_NAME="$(grep -m1 '^DB_NAME=' .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")"
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep 'bika-banquet-db' | head -1)

if [ -z "$DB_CONTAINER" ]; then
  echo "ERROR: bika-banquet-db container not found"
  exit 1
fi

psql_cmd() {
  docker exec -i "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" "$@"
}

echo "==> Checking user-mgmt schema columns"
psql_cmd -c "
SELECT 'users.isActive' AS check,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'isActive'
       ) AS ok
UNION ALL
SELECT 'users.hasAllVenueAccess',
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'hasAllVenueAccess'
       )
UNION ALL
SELECT 'user_permissions table',
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_name = 'user_permissions'
       )
UNION ALL
SELECT 'user_permissions.granted',
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'user_permissions' AND column_name = 'granted'
       );
"

echo ""
echo "==> Applying user-mgmt SQL migrations (idempotent)"
for file in \
  server/prisma/20260605_user_mgmt_overhaul.sql \
  server/prisma/20260606_user_permission_deny.sql
do
  if [ ! -f "$file" ]; then
    echo "ERROR: missing $file"
    exit 1
  fi
  echo "  apply $(basename "$file")"
  psql_cmd < "$file"
done

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
echo "==> Test login endpoint (expect Invalid credentials for fake user, NOT Login failed)"
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
echo "Done. Try logging in at https://banquet.bikafood.com/login"
