BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuantityUnit') THEN
    CREATE TYPE "QuantityUnit" AS ENUM ('kg', 'g', 'liter', 'ml', 'piece', 'packet', 'dozen', 'box');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION __safe_to_double(input_text TEXT)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := regexp_replace(input_text, '[^0-9\.\-]', '', 'g');
  IF cleaned ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
    RETURN cleaned::DOUBLE PRECISION;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ingredient units: normalize and cast from text to enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ingredients'
      AND column_name = 'defaultUnit'
      AND udt_name <> 'QuantityUnit'
  ) THEN
    UPDATE "ingredients"
    SET "defaultUnit" = lower(trim("defaultUnit"))
    WHERE "defaultUnit" IS NOT NULL;

    UPDATE "ingredients"
    SET "defaultUnit" = 'piece'
    WHERE "defaultUnit" NOT IN ('kg', 'g', 'liter', 'ml', 'piece', 'packet', 'dozen', 'box');

    ALTER TABLE "ingredients"
    ALTER COLUMN "defaultUnit" TYPE "QuantityUnit"
    USING "defaultUnit"::"QuantityUnit";
  END IF;
END $$;

-- Item recipe units: normalize and cast from text to enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'item_recipes'
      AND column_name = 'unit'
      AND udt_name <> 'QuantityUnit'
  ) THEN
    UPDATE "item_recipes"
    SET "unit" = lower(trim("unit"))
    WHERE "unit" IS NOT NULL;

    UPDATE "item_recipes"
    SET "unit" = 'piece'
    WHERE "unit" NOT IN ('kg', 'g', 'liter', 'ml', 'piece', 'packet', 'dozen', 'box');

    ALTER TABLE "item_recipes"
    ALTER COLUMN "unit" TYPE "QuantityUnit"
    USING "unit"::"QuantityUnit";
  END IF;
END $$;

-- Vendor supply units + XOR integrity cleanup.
UPDATE "vendor_supplies"
SET "itemId" = NULL
WHERE "productType" = 'ingredient' AND "itemId" IS NOT NULL;

UPDATE "vendor_supplies"
SET "ingredientId" = NULL
WHERE "productType" = 'item' AND "ingredientId" IS NOT NULL;

DELETE FROM "vendor_supplies"
WHERE ("productType" = 'ingredient' AND "ingredientId" IS NULL)
   OR ("productType" = 'item' AND "itemId" IS NULL);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vendor_supplies'
      AND column_name = 'unit'
      AND udt_name <> 'QuantityUnit'
  ) THEN
    UPDATE "vendor_supplies"
    SET "unit" = lower(trim("unit"))
    WHERE "unit" IS NOT NULL;

    UPDATE "vendor_supplies"
    SET "unit" = 'piece'
    WHERE "unit" NOT IN ('kg', 'g', 'liter', 'ml', 'piece', 'packet', 'dozen', 'box');

    ALTER TABLE "vendor_supplies"
    ALTER COLUMN "unit" TYPE "QuantityUnit"
    USING "unit"::"QuantityUnit";
  END IF;
END $$;

DROP INDEX IF EXISTS "vendor_supplies_vendorId_ingredientId_key";
DROP INDEX IF EXISTS "vendor_supplies_vendorId_itemId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "vendor_supplies_vendorId_ingredientId_unit_key"
  ON "vendor_supplies"("vendorId", "ingredientId", "unit");
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_supplies_vendorId_itemId_unit_key"
  ON "vendor_supplies"("vendorId", "itemId", "unit");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vendor_supplies_product_target_xor_chk'
  ) THEN
    ALTER TABLE "vendor_supplies"
    ADD CONSTRAINT "vendor_supplies_product_target_xor_chk"
    CHECK (
      ("productType" = 'ingredient' AND "ingredientId" IS NOT NULL AND "itemId" IS NULL)
      OR
      ("productType" = 'item' AND "itemId" IS NOT NULL AND "ingredientId" IS NULL)
    );
  END IF;
END $$;

-- Vendor entity expansion.
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "gstNumber" TEXT;
CREATE INDEX IF NOT EXISTS "vendors_phone_idx" ON "vendors"("phone");
CREATE INDEX IF NOT EXISTS "vendors_email_idx" ON "vendors"("email");

-- Vendor supply price history.
CREATE TABLE IF NOT EXISTS "vendor_supply_price_history" (
  "id" TEXT PRIMARY KEY,
  "vendorSupplyId" TEXT NOT NULL,
  "previousPrice" DOUBLE PRECISION,
  "newPrice" DOUBLE PRECISION NOT NULL,
  "changedBy" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_supply_price_history_vendorSupplyId_fkey"
    FOREIGN KEY ("vendorSupplyId") REFERENCES "vendor_supplies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "vendor_supply_price_history_vendorSupplyId_idx"
  ON "vendor_supply_price_history"("vendorSupplyId");
CREATE INDEX IF NOT EXISTS "vendor_supply_price_history_changedAt_idx"
  ON "vendor_supply_price_history"("changedAt");

INSERT INTO "vendor_supply_price_history" (
  "id",
  "vendorSupplyId",
  "previousPrice",
  "newPrice",
  "changedBy",
  "changedAt"
)
SELECT
  'vph_' || substring(md5(vs."id" || ':' || clock_timestamp()::TEXT), 1, 28),
  vs."id",
  NULL,
  vs."price",
  NULL,
  COALESCE(vs."updatedAt", vs."createdAt", CURRENT_TIMESTAMP)
FROM "vendor_supplies" vs
LEFT JOIN "vendor_supply_price_history" vph
  ON vph."vendorSupplyId" = vs."id"
WHERE vph."id" IS NULL;

-- Customer normalization columns.
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "phoneE164" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "alternatePhoneE164" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "whatsappE164" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "isWhatsappSameAsPhone" BOOLEAN DEFAULT true;

UPDATE "customers"
SET "phoneE164" = (
    CASE
      WHEN COALESCE(NULLIF(trim("phoneCountryCode"), ''), '+91') LIKE '+%' THEN COALESCE(NULLIF(trim("phoneCountryCode"), ''), '+91')
      ELSE '+' || COALESCE(NULLIF(trim("phoneCountryCode"), ''), '91')
    END
  ) || regexp_replace("phone", '[^0-9]', '', 'g')
WHERE "phone" IS NOT NULL
  AND regexp_replace("phone", '[^0-9]', '', 'g') <> ''
  AND ("phoneE164" IS NULL OR "phoneE164" = '');

UPDATE "customers"
SET "alternatePhoneE164" = (
    CASE
      WHEN COALESCE(NULLIF(trim("alterPhoneCountryCode"), ''), NULLIF(trim("phoneCountryCode"), ''), '+91') LIKE '+%' THEN COALESCE(NULLIF(trim("alterPhoneCountryCode"), ''), NULLIF(trim("phoneCountryCode"), ''), '+91')
      ELSE '+' || COALESCE(NULLIF(trim("alterPhoneCountryCode"), ''), NULLIF(trim("phoneCountryCode"), ''), '91')
    END
  ) || regexp_replace(COALESCE("alternatePhone", "alterPhone"), '[^0-9]', '', 'g')
WHERE COALESCE("alternatePhone", "alterPhone") IS NOT NULL
  AND regexp_replace(COALESCE("alternatePhone", "alterPhone"), '[^0-9]', '', 'g') <> ''
  AND ("alternatePhoneE164" IS NULL OR "alternatePhoneE164" = '');

UPDATE "customers"
SET "whatsappE164" = (
    CASE
      WHEN COALESCE(NULLIF(trim("whatsappCountryCode"), ''), NULLIF(trim("phoneCountryCode"), ''), '+91') LIKE '+%' THEN COALESCE(NULLIF(trim("whatsappCountryCode"), ''), NULLIF(trim("phoneCountryCode"), ''), '+91')
      ELSE '+' || COALESCE(NULLIF(trim("whatsappCountryCode"), ''), NULLIF(trim("phoneCountryCode"), ''), '91')
    END
  ) || regexp_replace(COALESCE("whatsapp", "whatsappNumber"), '[^0-9]', '', 'g')
WHERE COALESCE("whatsapp", "whatsappNumber") IS NOT NULL
  AND regexp_replace(COALESCE("whatsapp", "whatsappNumber"), '[^0-9]', '', 'g') <> ''
  AND ("whatsappE164" IS NULL OR "whatsappE164" = '');

WITH ranked AS (
  SELECT
    id,
    "phoneE164",
    ROW_NUMBER() OVER (PARTITION BY "phoneE164" ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "customers"
  WHERE "phoneE164" IS NOT NULL
)
UPDATE "customers" c
SET "phoneE164" = NULL
FROM ranked r
WHERE c.id = r.id
  AND r.rn > 1;

UPDATE "customers"
SET "isWhatsappSameAsPhone" = CASE
  WHEN COALESCE("whatsappE164", '') = '' THEN true
  WHEN COALESCE("phoneE164", '') = '' THEN false
  ELSE "whatsappE164" = "phoneE164"
END
WHERE "isWhatsappSameAsPhone" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "customers_phoneE164_key" ON "customers"("phoneE164");
CREATE INDEX IF NOT EXISTS "customers_phoneE164_idx" ON "customers"("phoneE164");
CREATE INDEX IF NOT EXISTS "customers_alternatePhoneE164_idx" ON "customers"("alternatePhoneE164");
CREATE INDEX IF NOT EXISTS "customers_whatsappE164_idx" ON "customers"("whatsappE164");

-- Enquiry datetime canonical columns.
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "startDateTime" TIMESTAMP(3);
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "endDateTime" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "enquiries_startDateTime_idx" ON "enquiries"("startDateTime");
CREATE INDEX IF NOT EXISTS "enquiries_endDateTime_idx" ON "enquiries"("endDateTime");

UPDATE "enquiries"
SET "startDateTime" = COALESCE("startDateTime", "functionDate"),
    "endDateTime" = COALESCE("endDateTime", "functionDate")
WHERE "functionDate" IS NOT NULL;

-- Booking numeric mirrors + datetime canonical columns.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "startDateTime" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "endDateTime" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "totalBillAmountValue" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "finalAmountValue" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "discountAmount2ndValue" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "discountPercentage2ndValue" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "advanceRequiredValue" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "paymentReceivedPercentValue" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "paymentReceivedAmountValue" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "dueAmountValue" DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS "bookings_startDateTime_idx" ON "bookings"("startDateTime");
CREATE INDEX IF NOT EXISTS "bookings_endDateTime_idx" ON "bookings"("endDateTime");

UPDATE "bookings"
SET "startDateTime" = COALESCE("startDateTime", "functionDate"),
    "endDateTime" = COALESCE("endDateTime", "functionDate"),
    "totalBillAmountValue" = COALESCE("totalBillAmountValue", __safe_to_double("totalBillAmount"), "totalAmount"),
    "finalAmountValue" = COALESCE("finalAmountValue", __safe_to_double("finalAmount"), "grandTotal"),
    "discountAmount2ndValue" = COALESCE("discountAmount2ndValue", __safe_to_double("discountAmount2nd")),
    "discountPercentage2ndValue" = COALESCE("discountPercentage2ndValue", __safe_to_double("discountPercentage2nd")),
    "advanceRequiredValue" = COALESCE("advanceRequiredValue", __safe_to_double("advanceRequired")),
    "paymentReceivedPercentValue" = COALESCE("paymentReceivedPercentValue", __safe_to_double("paymentReceivedPercent")),
    "paymentReceivedAmountValue" = COALESCE("paymentReceivedAmountValue", __safe_to_double("paymentReceivedAmount"), "advanceReceived"),
    "dueAmountValue" = COALESCE("dueAmountValue", __safe_to_double("dueAmount"), "balanceAmount");

-- Booking pack numeric mirrors + datetime canonical columns.
ALTER TABLE "booking_packs" ADD COLUMN IF NOT EXISTS "startDateTime" TIMESTAMP(3);
ALTER TABLE "booking_packs" ADD COLUMN IF NOT EXISTS "endDateTime" TIMESTAMP(3);
ALTER TABLE "booking_packs" ADD COLUMN IF NOT EXISTS "extraRateValue" DOUBLE PRECISION;
ALTER TABLE "booking_packs" ADD COLUMN IF NOT EXISTS "extraAmountValue" DOUBLE PRECISION;
ALTER TABLE "booking_packs" ADD COLUMN IF NOT EXISTS "hallRateValue" DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS "booking_packs_startDateTime_idx" ON "booking_packs"("startDateTime");
CREATE INDEX IF NOT EXISTS "booking_packs_endDateTime_idx" ON "booking_packs"("endDateTime");

UPDATE "booking_packs" bp
SET "startDateTime" = COALESCE(bp."startDateTime", b."functionDate"),
    "endDateTime" = COALESCE(bp."endDateTime", b."functionDate"),
    "extraRateValue" = COALESCE(bp."extraRateValue", __safe_to_double(bp."extraRate")),
    "extraAmountValue" = COALESCE(bp."extraAmountValue", __safe_to_double(bp."extraAmount")),
    "hallRateValue" = COALESCE(bp."hallRateValue", __safe_to_double(bp."hallRate"))
FROM "bookings" b
WHERE b."id" = bp."bookingId";

DROP FUNCTION IF EXISTS __safe_to_double(TEXT);

COMMIT;
