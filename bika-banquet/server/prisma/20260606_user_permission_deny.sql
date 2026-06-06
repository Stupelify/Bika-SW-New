-- Per-user permission overrides gain a grant/deny flag.
-- granted = true  -> the user is granted this permission on top of their roles.
-- granted = false -> the user is denied this permission even if a role grants it.
-- Existing rows (created before this column) were all grants, so default true
-- preserves their meaning.
BEGIN;

ALTER TABLE "user_permissions"
  ADD COLUMN IF NOT EXISTS "granted" BOOLEAN NOT NULL DEFAULT true;

COMMIT;
