DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorProductType') THEN
    CREATE TYPE "VendorProductType" AS ENUM ('ingredient', 'item');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ingredients" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "defaultUnit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "item_recipes" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "ingredientId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "item_recipes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "item_recipes_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "item_recipes_itemId_ingredientId_key" ON "item_recipes"("itemId", "ingredientId");
CREATE INDEX IF NOT EXISTS "item_recipes_itemId_idx" ON "item_recipes"("itemId");
CREATE INDEX IF NOT EXISTS "item_recipes_ingredientId_idx" ON "item_recipes"("ingredientId");

CREATE TABLE IF NOT EXISTS "vendors" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "vendor_supplies" (
  "id" TEXT PRIMARY KEY,
  "vendorId" TEXT NOT NULL,
  "productType" "VendorProductType" NOT NULL,
  "ingredientId" TEXT,
  "itemId" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_supplies_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "vendor_supplies_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "vendor_supplies_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "vendor_supplies_vendorId_ingredientId_key" ON "vendor_supplies"("vendorId", "ingredientId");
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_supplies_vendorId_itemId_key" ON "vendor_supplies"("vendorId", "itemId");
CREATE INDEX IF NOT EXISTS "vendor_supplies_vendorId_idx" ON "vendor_supplies"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_supplies_productType_idx" ON "vendor_supplies"("productType");
CREATE INDEX IF NOT EXISTS "vendor_supplies_ingredientId_idx" ON "vendor_supplies"("ingredientId");
CREATE INDEX IF NOT EXISTS "vendor_supplies_itemId_idx" ON "vendor_supplies"("itemId");
