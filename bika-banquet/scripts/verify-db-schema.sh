#!/bin/bash
# Verify production DB has columns required by current Prisma schema.
# Exits non-zero when schema/code mismatch would break login or bookings API.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${DB_NAME:-$(grep -m1 '^DB_NAME=' .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)}"
if [ -z "$DB_NAME" ]; then
  DB_NAME="bika_banquet_v2"
fi

DB_CONTAINER="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep 'bika-banquet-db' | head -1 || true)}"
if [ -z "$DB_CONTAINER" ]; then
  echo "ERROR: bika-banquet-db container not found"
  exit 1
fi

psql_cmd() {
  docker exec -i "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" "$@"
}

echo "==> Verifying DB schema (db=$DB_NAME)"

MISSING=$(psql_cmd -tAc "
  SELECT COUNT(*) FROM (
    SELECT 1 WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'isActive'
    )
    UNION ALL
    SELECT 1 WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'hasAllVenueAccess'
    )
    UNION ALL
    SELECT 1 WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_permissions' AND column_name = 'granted'
    )
    UNION ALL
    SELECT 1 WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'startDateTime'
    )
    UNION ALL
    SELECT 1 WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'paymentReceivedAmountValue'
    )
  ) t;
")

if [ "$MISSING" != "0" ]; then
  echo "ERROR: schema incomplete ($MISSING checks failed)."
  echo "Run: bash scripts/fix-db-schema.sh"
  exit 1
fi

echo "OK: user-mgmt and booking columns present"
