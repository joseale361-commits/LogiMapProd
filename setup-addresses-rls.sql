-- RLS policies for addresses table
-- Run this in Supabase SQL Editor to allow customers to view their addresses

-- Enable RLS if not enabled
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;

-- Allow users to view their own addresses
CREATE POLICY "Users can view their own addresses" ON addresses FOR
SELECT TO authenticated USING (auth.uid () = customer_id);

-- Allow users to insert their own addresses
CREATE POLICY "Users can insert their own addresses" ON addresses FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = customer_id);

-- Allow users to update their own addresses
CREATE POLICY "Users can update their own addresses" ON addresses FOR
UPDATE TO authenticated USING (auth.uid () = customer_id)
WITH
    CHECK (auth.uid () = customer_id);

-- Allow users to delete their own addresses
CREATE POLICY "Users can delete their own addresses" ON addresses FOR DELETE TO authenticated USING (auth.uid () = customer_id);

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE
    tablename = 'addresses';