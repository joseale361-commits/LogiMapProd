-- Add target_stock column to product_variants table
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS target_stock INTEGER DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN product_variants.target_stock IS 'Daily target stock limit for B2B logic';