-- User-management / access-control overhaul (Phase 0 foundation)
-- Adds user lifecycle + login-tracking columns, an all-venues access flag,
-- and a per-user permission grant table (user_permissions).
BEGIN;

-- ---------------------------------------------------------------------------
-- New columns on "users"
-- ---------------------------------------------------------------------------
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "disabledReason" TEXT,
  ADD COLUMN IF NOT EXISTS "hasAllVenueAccess" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- Per-user permission grants (in addition to role-derived permissions).
-- Mirrors the user_banquets table style.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_permissions" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"       TEXT        NOT NULL,
  "permissionId" TEXT        NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE,
  CONSTRAINT "user_permissions_userId_permissionId_key" UNIQUE ("userId", "permissionId")
);

CREATE INDEX IF NOT EXISTS "user_permissions_userId_idx" ON "user_permissions"("userId");
CREATE INDEX IF NOT EXISTS "user_permissions_permissionId_idx" ON "user_permissions"("permissionId");

-- ---------------------------------------------------------------------------
-- Behavior-preserving backfill (IMPORTANT)
-- Under the OLD rule, a user with NO rows in user_banquets had unrestricted
-- access to every venue (fail-open). The overhaul switches venue access to
-- fail-closed (no rows => no access). To avoid locking those users out, grant
-- them the explicit all-venues flag so their effective access is unchanged.
-- ---------------------------------------------------------------------------
UPDATE "users"
SET "hasAllVenueAccess" = true
WHERE "id" NOT IN (SELECT DISTINCT "userId" FROM "user_banquets");

-- Seed passwordChangedAt for existing users so password-age logic has a basis.
UPDATE "users"
SET "passwordChangedAt" = "updatedAt"
WHERE "passwordChangedAt" IS NULL;

COMMIT;
