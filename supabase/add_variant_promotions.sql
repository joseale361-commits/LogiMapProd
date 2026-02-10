-- Add promotion columns to product_variants table
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price numeric(10, 2) DEFAULT null;

-- Optional: Create an index for performance on filtered implementations
CREATE INDEX IF NOT EXISTS idx_product_variants_promotions ON product_variants (is_new, is_on_sale)
WHERE
    is_new = true
    OR is_on_sale = true;