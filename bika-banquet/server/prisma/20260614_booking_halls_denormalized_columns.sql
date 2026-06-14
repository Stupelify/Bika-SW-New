BEGIN;

-- Denormalized booking_halls columns referenced by Prisma schema but missing from
-- older production DBs (introspected ahead of raw SQL migration).
ALTER TABLE "booking_halls"
  ADD COLUMN IF NOT EXISTS "booking_status" TEXT,
  ADD COLUMN IF NOT EXISTS "booking_is_latest" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "time_range" tsrange;

UPDATE "booking_halls" bh
SET
  "booking_status" = COALESCE(bh."booking_status", b."status"),
  "booking_is_latest" = COALESCE(bh."booking_is_latest", b."isLatest")
FROM "bookings" b
WHERE b.id = bh."bookingId";

COMMIT;
