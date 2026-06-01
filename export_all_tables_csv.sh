#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/bika-banquet"

timestamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
out_dir="${1:-../db_export_${timestamp}/csv}"

mkdir -p "$out_dir"

tables="$(
  docker compose exec -T db sh -lc \
    "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -Atc \"select tablename from pg_tables where schemaname='public' order by tablename;\""
)"

for table in $tables; do
  echo "Exporting $table..."
  docker compose exec -T db sh -lc \
    "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"\\\\copy \\\"public\\\".\\\"${table}\\\" TO STDOUT WITH CSV HEADER\"" \
    > "${out_dir}/${table}.csv"
done

echo "Done. Wrote CSVs to: ${out_dir}"
