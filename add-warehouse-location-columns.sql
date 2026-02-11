-- Add location geography column to distributors table
-- This stores the warehouse coordinates as a geography point (SRID 4326 for GPS coordinates)

-- Check if column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'distributors' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE distributors ADD COLUMN location geography(Point, 4326);
        
        -- Create index for faster spatial queries
        CREATE INDEX IF NOT EXISTS distributors_location_idx ON distributors USING GIST (location);
        
        RAISE NOTICE 'Column location added successfully to distributors table';
    ELSE
        RAISE NOTICE 'Column location already exists in distributors table';
    END IF;
END $$;

-- Optional: Add address column for readable address string
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'distributors' 
        AND column_name = 'warehouse_address'
    ) THEN
        ALTER TABLE distributors ADD COLUMN warehouse_address TEXT;
        RAISE NOTICE 'Column warehouse_address added successfully to distributors table';
    ELSE
        RAISE NOTICE 'Column warehouse_address already exists in distributors table';
    END IF;
END $$;