-- Add pencil booking fields to bookings table
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "isPencilBooking" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "pencilExpiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "bookings_isPencilBooking_idx" ON "bookings"("isPencilBooking");
