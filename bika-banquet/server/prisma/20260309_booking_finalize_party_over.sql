BEGIN;

ALTER TABLE "finalized_bookings"
  ADD COLUMN IF NOT EXISTS "finalizedBy" TEXT;

CREATE INDEX IF NOT EXISTS "finalized_bookings_finalizedBy_idx"
  ON "finalized_bookings"("finalizedBy");

CREATE INDEX IF NOT EXISTS "finalized_bookings_finalizedAt_idx"
  ON "finalized_bookings"("finalizedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'finalized_bookings_finalizedBy_fkey'
  ) THEN
    ALTER TABLE "finalized_bookings"
      ADD CONSTRAINT "finalized_bookings_finalizedBy_fkey"
      FOREIGN KEY ("finalizedBy") REFERENCES "users"("id")
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
