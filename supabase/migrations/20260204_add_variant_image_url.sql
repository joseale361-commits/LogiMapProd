-- Migration to add image_url to product_variants table
-- Note: Depending on your environment, the table might be called 'product_variants' or 'variants'.
-- Based on the codebase, we expect 'product_variants'.

DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_variants') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'image_url') THEN
            ALTER TABLE IF EXISTS product_variants ADD COLUMN image_url TEXT;
        END IF;
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'variants') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'variants' AND column_name = 'image_url') THEN
            ALTER TABLE IF EXISTS variants ADD COLUMN image_url TEXT;
        END IF;
    END IF;
END $$;