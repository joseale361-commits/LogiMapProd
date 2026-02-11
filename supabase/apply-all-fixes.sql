-- ============================================================================
-- SUPABASE FIXES READY TO RUN (WITH BACKUP)
-- ============================================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Then click "Run" to execute all fixes at once
-- ============================================================================

-- ============================================================================
-- BACKUP: Save current RLS policies and indexes before making changes
-- ============================================================================

-- Backup RLS policies
DROP TABLE IF EXISTS backup_rls_policies;

CREATE TABLE backup_rls_policies AS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    pg_get_expr (polqual, polrelid) as using_clause,
    pg_get_expr (polwithcheck, polrelid) as check_clause,
    pg_get_policydef (oid) as policy_definition,
    now() as backup_timestamp
FROM pg_policies
WHERE
    schemaname = 'public';

-- Backup indexes
DROP TABLE IF EXISTS backup_indexes;

CREATE TABLE backup_indexes AS
SELECT
    tablename,
    indexname,
    indexdef,
    now() as backup_timestamp
FROM pg_indexes
WHERE
    schemaname = 'public';

SELECT 'Backup created successfully' as status;

SELECT 'Policies backed up: ' || COUNT(*) FROM backup_rls_policies;

SELECT 'Indexes backed up: ' || COUNT(*) FROM backup_indexes;

-- ============================================================================
-- PART 1: FIX RLS FOR addresses TABLE (CRITICAL)
-- ============================================================================

-- Verificar columnas en la tabla addresses primero
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'addresses';

-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;

-- Crear políticas correctas usando 'user_id'
CREATE POLICY "Users can view their own addresses" ON addresses FOR
SELECT TO authenticated USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own addresses" ON addresses FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own addresses" ON addresses FOR
UPDATE TO authenticated USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can delete their own addresses" ON addresses FOR DELETE TO authenticated USING (auth.uid () = user_id);

SELECT 'RLS addresses fixed' as status;

-- ============================================================================
-- PART 2: ADD MISSING INDEXES (HIGH PRIORITY)
-- ============================================================================

-- Indices para orders
CREATE INDEX IF NOT EXISTS idx_orders_distributor_id ON orders (distributor_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_distributor_status ON orders (distributor_id, status);

-- Indices para products
CREATE INDEX IF NOT EXISTS idx_products_distributor_id ON products (distributor_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);

-- Indices para route_stops
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops (route_id);

CREATE INDEX IF NOT EXISTS idx_route_stops_order_id ON route_stops (order_id);

CREATE INDEX IF NOT EXISTS idx_route_stops_status ON route_stops (status);

-- Indices para distributor_users
CREATE INDEX IF NOT EXISTS idx_distributor_users_user_id ON distributor_users (user_id);

CREATE INDEX IF NOT EXISTS idx_distributor_users_distributor_id ON distributor_users (distributor_id);

CREATE INDEX IF NOT EXISTS idx_distributor_users_user_distributor ON distributor_users (user_id, distributor_id);

CREATE INDEX IF NOT EXISTS idx_distributor_users_is_active ON distributor_users (is_active);

-- Indices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_distributor_id ON profiles (distributor_id);

-- Indices para customer_relationships
CREATE INDEX IF NOT EXISTS idx_customer_relationships_customer_id ON customer_relationships (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_relationships_distributor_id ON customer_relationships (distributor_id);

-- Indices para addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);

-- Indices para payments
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments (customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_distributor_id ON payments (distributor_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);

SELECT 'Indexes created' as status;

-- ============================================================================
-- PART 3: ADD GIN INDEXES FOR JSONB COLUMNS (MEDIUM)
-- ============================================================================

-- Solo crear si usas PostGIS y consultas estos campos
-- CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders USING GIN (delivery_location);
-- CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);

SELECT 'JSONB indexes skipped (uncomment if needed)' as status;

-- ============================================================================
-- PART 4: VERIFY RLS POLICIES
-- ============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE
    tablename IN (
        'addresses',
        'orders',
        'products',
        'profiles'
    )
ORDER BY tablename, policyname;

-- ============================================================================
-- PART 5: VERIFY INDEXES
-- ============================================================================

SELECT tablename, indexname
FROM pg_indexes
WHERE
    schemaname = 'public'
ORDER BY tablename;

SELECT 'Audit complete' as status;

-- ============================================================================
-- FINISH: Summary
-- ============================================================================
SELECT '========================================' as separator;

SELECT 'ALL FIXES APPLIED SUCCESSFULLY' as result;

SELECT '========================================' as separator;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback, run this in Supabase SQL Editor:

-- -- Restore policies from backup
-- DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;
-- DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;
-- DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;
-- DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;

-- -- Delete created indexes
-- DROP INDEX IF EXISTS idx_orders_distributor_id;
-- DROP INDEX IF EXISTS idx_orders_customer_id;
-- DROP INDEX IF EXISTS idx_orders_status;
-- DROP INDEX IF EXISTS idx_orders_distributor_status;
-- DROP INDEX IF EXISTS idx_products_distributor_id;
-- DROP INDEX IF EXISTS idx_products_category_id;
-- DROP INDEX IF EXISTS idx_products_is_active;
-- DROP INDEX IF EXISTS idx_route_stops_route_id;
-- DROP INDEX IF EXISTS idx_route_stops_order_id;
-- DROP INDEX IF EXISTS idx_route_stops_status;
-- DROP INDEX IF EXISTS idx_distributor_users_user_id;
-- DROP INDEX IF EXISTS idx_distributor_users_distributor_id;
-- DROP INDEX IF EXISTS idx_distributor_users_user_distributor;
-- DROP INDEX IF EXISTS idx_distributor_users_is_active;
-- DROP INDEX IF EXISTS idx_profiles_user_id;
-- DROP INDEX IF EXISTS idx_profiles_distributor_id;
-- DROP INDEX IF EXISTS idx_customer_relationships_customer_id;
-- DROP INDEX IF EXISTS idx_customer_relationships_distributor_id;
-- DROP INDEX IF EXISTS idx_addresses_user_id;
-- DROP INDEX IF EXISTS idx_payments_customer_id;
-- DROP INDEX IF EXISTS idx_payments_distributor_id;
-- DROP INDEX IF EXISTS idx_payments_order_id;

-- -- Delete backup tables
-- DROP TABLE IF EXISTS backup_rls_policies;
-- DROP TABLE IF EXISTS backup_indexes;