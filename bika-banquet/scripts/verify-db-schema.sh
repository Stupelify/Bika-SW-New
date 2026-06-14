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

# Each row: table|column
REQUIRED=(
  "users|isActive"
  "users|hasAllVenueAccess"
  "user_permissions|granted"
  "customers|phoneE164"
  "bookings|startDateTime"
  "bookings|endDateTime"
  "bookings|paymentReceivedAmountValue"
  "bookings|dueAmountValue"
  "bookings|totalBillAmountValue"
  "bookings|finalAmountValue"
  "bookings|advanceRequiredValue"
  "bookings|isPencilBooking"
  "bookings|pencilExpiresAt"
  "bookings|settlementDiscountPercent"
  "bookings|settlementDiscountAmount"
  "bookings|settlementTotalAmount"
  "booking_halls|booking_status"
  "booking_halls|booking_is_latest"
)

MISSING_LIST=""
MISSING_COUNT=0

for entry in "${REQUIRED[@]}"; do
  table="${entry%%|*}"
  column="${entry##*|}"
  exists="$(psql_cmd -tAc "
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${table}'
        AND column_name = '${column}'
    );
  ")"
  if [ "$exists" != "t" ]; then
    MISSING_COUNT=$((MISSING_COUNT + 1))
    MISSING_LIST="${MISSING_LIST}  - ${table}.${column}"$'\n'
  fi
done

if [ "$MISSING_COUNT" != "0" ]; then
  echo "ERROR: schema incomplete ($MISSING_COUNT column(s) missing):"
  printf '%s' "$MISSING_LIST"
  echo "Run: bash scripts/fix-db-schema.sh"
  exit 1
fi

echo "OK: user-mgmt, customer search, booking, and booking_halls columns present"
