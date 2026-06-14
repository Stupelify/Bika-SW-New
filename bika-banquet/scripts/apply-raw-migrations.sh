#!/bin/bash
# Apply tracked raw SQL patches in server/prisma/*.sql via the Postgres container.
# Idempotent — safe to re-run. Used by deploy.sh, ci-deploy.sh, and repair scripts.
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

echo "==> Applying raw SQL patches (db=$DB_NAME, container=$DB_CONTAINER)"

psql_cmd <<'SQL'
CREATE TABLE IF NOT EXISTS _raw_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL

find server/prisma -maxdepth 2 -type f -name '*.sql' ! -name 'legacy_schema.sql' | sort | while read -r file; do
  name="${file#server/prisma/}"
  already_applied="$(psql_cmd -tAc "SELECT 1 FROM _raw_migrations WHERE name = '$name'")"
  if [ "$already_applied" = "1" ]; then
    echo "  skip  $name"
    continue
  fi
  echo "  apply $name"
  psql_cmd < "$file"
  psql_cmd -c "INSERT INTO _raw_migrations (name) VALUES ('$name')"
done

echo "==> Raw SQL patches complete"
