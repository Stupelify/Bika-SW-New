-- User-level banquet access restrictions
-- No rows = unrestricted (full access). Rows = allowed banquets only.
CREATE TABLE IF NOT EXISTS "user_banquets" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL,
  "banquetId" TEXT        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_banquets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_banquets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_banquets_banquetId_fkey" FOREIGN KEY ("banquetId") REFERENCES "banquets"("id") ON DELETE CASCADE,
  CONSTRAINT "user_banquets_userId_banquetId_key" UNIQUE ("userId", "banquetId")
);

CREATE INDEX IF NOT EXISTS "user_banquets_userId_idx" ON "user_banquets"("userId");
