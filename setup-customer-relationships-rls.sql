-- RLS policies for customer_relationships table
-- Run this in Supabase SQL Editor to enable customer favorite functionality

-- Enable RLS on customer_relationships if not already enabled
ALTER TABLE customer_relationships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own relationships" ON customer_relationships;

DROP POLICY IF EXISTS "Users can insert their own relationships" ON customer_relationships;

DROP POLICY IF EXISTS "Users can delete their own relationships" ON customer_relationships;

-- Allow customers to view their own relationships
CREATE POLICY "Users can view their own relationships" ON customer_relationships FOR
SELECT TO authenticated USING (auth.uid () = customer_id);

-- Allow customers to add new favorites
CREATE POLICY "Users can insert their own relationships" ON customer_relationships FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = customer_id);

-- Allow customers to remove favorites
CREATE POLICY "Users can delete their own relationships" ON customer_relationships FOR DELETE TO authenticated USING (auth.uid () = customer_id);

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE
    tablename = 'customer_relationships';