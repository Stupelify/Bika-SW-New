#!/bin/bash
# Diagnose and repair DB schema after user-mgmt deploy when login returns
# generic "Login failed" (server Prisma query crash — schema/code mismatch).
# Prefer fix-db-schema.sh — this script delegates to it for full repair.
set -euo pipefail

cd "$(dirname "$0")/.."
exec bash scripts/fix-db-schema.sh
