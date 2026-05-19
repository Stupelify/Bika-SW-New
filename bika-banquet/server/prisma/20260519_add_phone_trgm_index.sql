-- Enable trigram extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for fast ILIKE on phoneE164 (primary E164 field)
CREATE INDEX IF NOT EXISTS "Customer_phoneE164_trgm_idx"
ON customers USING gin ("phoneE164" gin_trgm_ops);

-- GIN index for phone (legacy field used in searches)
CREATE INDEX IF NOT EXISTS "Customer_phone_trgm_idx"
ON customers USING gin (phone gin_trgm_ops);
