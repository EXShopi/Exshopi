-- Production-safe additive repair for Product pricing columns.
-- Do not drop/reset data. All columns are nullable and use IF NOT EXISTS.
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "compare_at_price" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_price" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "price_uae" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "price_ksa" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "price_qatar" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "price_kuwait" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "price_bahrain" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "price_oman" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_uae" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_ksa" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_qatar" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_kuwait" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_bahrain" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "compare_at_price_oman" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "specifications" JSONB,
  ADD COLUMN IF NOT EXISTS "prices_by_country" JSONB;

UPDATE "products"
SET
  "compare_at_price" = COALESCE("compare_at_price", "original_price", "sale_price", "price"),
  "compare_price" = COALESCE("compare_price", "original_price"::DOUBLE PRECISION, "sale_price"::DOUBLE PRECISION, "price"::DOUBLE PRECISION),
  "price_uae" = COALESCE("price_uae", "price"),
  "price_ksa" = COALESCE("price_ksa", "price_uae", "price"),
  "price_qatar" = COALESCE("price_qatar", "price_uae", "price"),
  "price_kuwait" = COALESCE("price_kuwait", "price_uae", "price"),
  "price_bahrain" = COALESCE("price_bahrain", "price_uae", "price"),
  "price_oman" = COALESCE("price_oman", "price_uae", "price"),
  "compare_at_price_uae" = COALESCE("compare_at_price_uae", "compare_at_price", "original_price", "sale_price", "price"),
  "compare_at_price_ksa" = COALESCE("compare_at_price_ksa", "compare_at_price_uae", "compare_at_price", "original_price", "sale_price", "price"),
  "compare_at_price_qatar" = COALESCE("compare_at_price_qatar", "compare_at_price_uae", "compare_at_price", "original_price", "sale_price", "price"),
  "compare_at_price_kuwait" = COALESCE("compare_at_price_kuwait", "compare_at_price_uae", "compare_at_price", "original_price", "sale_price", "price"),
  "compare_at_price_bahrain" = COALESCE("compare_at_price_bahrain", "compare_at_price_uae", "compare_at_price", "original_price", "sale_price", "price"),
  "compare_at_price_oman" = COALESCE("compare_at_price_oman", "compare_at_price_uae", "compare_at_price", "original_price", "sale_price", "price"),
  "prices_by_country" = COALESCE(
    "prices_by_country",
    jsonb_build_object(
      'AE', COALESCE("price_uae", "price")::DOUBLE PRECISION,
      'SA', COALESCE("price_ksa", "price_uae", "price")::DOUBLE PRECISION,
      'QA', COALESCE("price_qatar", "price_uae", "price")::DOUBLE PRECISION,
      'KW', COALESCE("price_kuwait", "price_uae", "price")::DOUBLE PRECISION,
      'BH', COALESCE("price_bahrain", "price_uae", "price")::DOUBLE PRECISION,
      'OM', COALESCE("price_oman", "price_uae", "price")::DOUBLE PRECISION
    )
  );
