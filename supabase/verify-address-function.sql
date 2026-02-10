-- Verification script for create_address_with_location function
-- This script checks if the function exists and has proper permissions

-- Check if the function exists
SELECT
    routine_name,
    routine_type,
    security_type,
    is_deterministic,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE
    routine_schema = 'public'
    AND routine_name = 'create_address_with_location';

-- Check function permissions
SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges
WHERE
    routine_schema = 'public'
    AND routine_name = 'create_address_with_location';

-- Check if PostGIS extension is installed
SELECT extname, extversion
FROM pg_extension
WHERE
    extname = 'postgis';

-- Check addresses table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'addresses'
ORDER BY ordinal_position;

-- Check RLS policies on addresses table
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
    tablename = 'addresses';