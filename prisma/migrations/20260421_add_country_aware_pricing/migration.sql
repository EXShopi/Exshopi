ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "price_uae" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "price_ksa" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_uae" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_ksa" DECIMAL(12,2);

UPDATE "products"
SET
  "price_uae" = COALESCE("price_uae", "price"),
  "compare_at_price_uae" = COALESCE("compare_at_price_uae", "original_price", "price");

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "tax_rate" DECIMAL(5,4);

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "compare_at_price" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "price_snapshot_country" TEXT,
  ADD COLUMN IF NOT EXISTS "price_snapshot_currency" TEXT;
