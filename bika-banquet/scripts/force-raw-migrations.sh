#!/bin/bash
# Force re-apply every raw SQL patch (ignores _raw_migrations). Safe because
# patches use IF NOT EXISTS / idempotent DDL.
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

echo "==> Force re-applying all raw SQL files (db=$DB_NAME)"

find server/prisma -maxdepth 2 -type f -name '*.sql' ! -name 'legacy_schema.sql' | sort | while read -r file; do
  echo "  force ${file#server/prisma/}"
  psql_cmd < "$file"
done

echo "==> Force re-apply complete"
