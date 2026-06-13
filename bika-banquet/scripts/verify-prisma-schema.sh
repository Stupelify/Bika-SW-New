#!/usr/bin/env bash
# Verifies Prisma schema matches the database after db push + raw migrations.
# Used before merge to confirm schema.prisma changes are introspection-only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_URL="${DATABASE_URL:-postgresql://postgres:secure_password_change_me@localhost:5432/bika_banquet_verify?schema=public}"

echo "==> Creating ephemeral verify database"
DB_NAME="${DB_URL##*/}"; DB_NAME="${DB_NAME%%\?*}"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres createdb "${DB_NAME}" 2>/dev/null || true

echo "==> Pushing schema"
DATABASE_URL="$DB_URL" npm --prefix "$ROOT/server" exec -- prisma db push --accept-data-loss --skip-generate --schema "$ROOT/server/prisma/schema.prisma"

echo "==> Applying raw SQL migrations"
DATABASE_URL="$DB_URL" npm --prefix "$ROOT/server" run db:apply-raw

echo "==> Diff: live DB vs schema.prisma (expect empty)"
DIFF="$(DATABASE_URL="$DB_URL" npm --prefix "$ROOT/server" exec -- prisma migrate diff \
  --from-url "$DB_URL" \
  --to-schema-datamodel "$ROOT/server/prisma/schema.prisma" \
  --exit-code 2>&1)" || {
  code=$?
  if [ "$code" -eq 2 ]; then
    echo "SCHEMA DRIFT DETECTED:"
    echo "$DIFF"
    exit 1
  fi
  echo "$DIFF"
  exit "$code"
}

echo "OK: schema.prisma matches database after push + raw migrations."
echo "Deploy uses db:apply-raw (entrypoint.sh does NOT run prisma migrate deploy)."
