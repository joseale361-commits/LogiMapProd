-- ============================================================================
-- RLS Performance Optimization: InitPlan Fix
-- ============================================================================
-- This script optimizes RLS policies by replacing direct auth.uid() and
-- auth.jwt() calls with subqueries (select auth.uid()) to prevent
-- re-evaluation for every row.
--
-- Supabase Database Linter Recommendation: Auth RLS InitPlan
-- ============================================================================

-- ============================================================================
-- TABLE: orders
-- ============================================================================

-- Update orders RLS policies to use optimized auth.uid() pattern
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT pg_catalog.p_getexpr(pol.poly_expr, pol.poly_mattypid) AS expr,
               pol.policyname,
               pol.procname
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
        WHERE nsp.nspname = 'public'
          AND cls.relname = 'orders'
    LOOP
        RAISE NOTICE 'Policy: %', pol.policyname;
    END LOOP;
END $$;

-- Create updated policies for orders table
-- Policy: Users can see their distributor's orders
DROP POLICY IF EXISTS "Users can view distributor orders" ON orders;

CREATE POLICY "Users can view distributor orders" ON orders FOR
SELECT USING (
        (
            distributor_id IN (
                SELECT distributor_id
                FROM user_distributors
                WHERE
                    user_id = (
                        SELECT auth.uid ()
                    )
            )
        )
    );

-- Policy: Users can insert orders for their distributor
DROP POLICY IF EXISTS "Users can insert distributor orders" ON orders;

CREATE POLICY "Users can insert distributor orders" ON orders FOR
INSERT
WITH
    CHECK (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- Policy: Users can update orders for their distributor
DROP POLICY IF EXISTS "Users can update distributor orders" ON orders;

CREATE POLICY "Users can update distributor orders" ON orders FOR
UPDATE USING (
    (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    )
)
WITH
    CHECK (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- ============================================================================
-- TABLE: products
-- ============================================================================

-- Policy: Users can see products from their distributor
DROP POLICY IF EXISTS "Users can view distributor products" ON products;

CREATE POLICY "Users can view distributor products" ON products FOR
SELECT USING (
        (
            distributor_id IN (
                SELECT distributor_id
                FROM user_distributors
                WHERE
                    user_id = (
                        SELECT auth.uid ()
                    )
            )
        )
    );

-- Policy: Users can insert products for their distributor
DROP POLICY IF EXISTS "Users can insert distributor products" ON products;

CREATE POLICY "Users can insert distributor products" ON products FOR
INSERT
WITH
    CHECK (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- Policy: Users can update products for their distributor
DROP POLICY IF EXISTS "Users can update distributor products" ON products;

CREATE POLICY "Users can update distributor products" ON products FOR
UPDATE USING (
    (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    )
)
WITH
    CHECK (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- Policy: Users can delete products for their distributor
DROP POLICY IF EXISTS "Users can delete distributor products" ON products;

CREATE POLICY "Users can delete distributor products" ON products FOR DELETE USING (
    (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    )
);

-- ============================================================================
-- TABLE: distributors
-- ============================================================================

-- Policy: Users can view their distributors
DROP POLICY IF EXISTS "Users can view their distributors" ON distributors;

CREATE POLICY "Users can view their distributors" ON distributors FOR
SELECT USING (
        (
            id IN (
                SELECT distributor_id
                FROM user_distributors
                WHERE
                    user_id = (
                        SELECT auth.uid ()
                    )
            )
        )
    );

-- Policy: Users can update their distributors
DROP POLICY IF EXISTS "Users can update their distributors" ON distributors;

CREATE POLICY "Users can update their distributors" ON distributors FOR
UPDATE USING (
    (
        id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    )
)
WITH
    CHECK (
        id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- ============================================================================
-- TABLE: routes
-- ============================================================================

-- Policy: Users can view routes for their distributor
DROP POLICY IF EXISTS "Users can view distributor routes" ON routes;

CREATE POLICY "Users can view distributor routes" ON routes FOR
SELECT USING (
        (
            distributor_id IN (
                SELECT distributor_id
                FROM user_distributors
                WHERE
                    user_id = (
                        SELECT auth.uid ()
                    )
            )
        )
    );

-- Policy: Users can insert routes for their distributor
DROP POLICY IF EXISTS "Users can insert distributor routes" ON routes;

CREATE POLICY "Users can insert distributor routes" ON routes FOR
INSERT
WITH
    CHECK (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- Policy: Users can update routes for their distributor
DROP POLICY IF EXISTS "Users can update distributor routes" ON routes;

CREATE POLICY "Users can update distributor routes" ON routes FOR
UPDATE USING (
    (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    )
)
WITH
    CHECK (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    );

-- Policy: Users can delete routes for their distributor
DROP POLICY IF EXISTS "Users can delete distributor routes" ON routes;

CREATE POLICY "Users can delete distributor routes" ON routes FOR DELETE USING (
    (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    )
);

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (
        (
            user_id = (
                SELECT auth.uid ()
            )
        )
    );

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (
    (
        user_id = (
            SELECT auth.uid ()
        )
    )
)
WITH
    CHECK (
        (
            user_id = (
                SELECT auth.uid ()
            )
        )
    );

-- Policy: Users can view profiles from their distributor
DROP POLICY IF EXISTS "Users can view distributor profiles" ON profiles;

CREATE POLICY "Users can view distributor profiles" ON profiles FOR
SELECT USING (
        (
            distributor_id IN (
                SELECT distributor_id
                FROM user_distributors
                WHERE
                    user_id = (
                        SELECT auth.uid ()
                    )
            )
        )
    );

-- Policy: Users can update profiles from their distributor
DROP POLICY IF EXISTS "Users can update distributor profiles" ON profiles;

CREATE POLICY "Users can update distributor profiles" ON profiles FOR
UPDATE USING (
    (
        distributor_id IN (
            SELECT distributor_id
            FROM user_distributors
            WHERE
                user_id = (
                    SELECT auth.uid ()
                )
        )
    )
)
WITH
    CHECK (
        (
            distributor_id IN (
                SELECT distributor_id
                FROM user_distributors
                WHERE
                    user_id = (
                        SELECT auth.uid ()
                    )
            )
        )
    );

-- ============================================================================
-- Verification: Check if policies are using optimized InitPlan
-- ============================================================================

-- This query checks if any RLS policies still use direct auth.uid() or auth.jwt()
-- instead of the optimized (select auth.uid()) pattern

SELECT
    nsp.nspname AS schema_name,
    cls.relname AS table_name,
    pol.polname AS policy_name,
    CASE pol.poltype
        WHEN 'r' THEN 'SELECT'
        WHEN 'w' THEN 'INSERT'
        WHEN 'a' THEN 'UPDATE (USING)'
        WHEN 'c' THEN 'UPDATE (WITH CHECK)'
        WHEN 'd' THEN 'DELETE'
    END AS policy_type,
    pg_get_policydef (pol.oid) AS policy_definition,
    CASE
        WHEN pg_get_expr (pol.polqual, pol.polrelid) LIKE '%auth.uid()%'
        AND pg_get_expr (pol.polqual, pol.polrelid) NOT LIKE '%(SELECT auth.uid())%'
        OR pg_get_expr (pol.polqual, pol.polrelid) LIKE '%auth.jwt()%'
        AND pg_get_expr (pol.polqual, pol.polrelid) NOT LIKE '%(SELECT auth.jwt())%' THEN '⚠️ NEEDS OPTIMIZATION'
        WHEN pg_get_expr (pol.polqual, pol.polrelid) LIKE '%(SELECT auth.uid())%'
        OR pg_get_expr (pol.polqual, pol.polrelid) LIKE '%(SELECT auth.jwt())%' THEN '✅ OPTIMIZED'
        ELSE 'N/A'
    END AS optimization_status
FROM
    pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE
    nsp.nspname = 'public'
    AND cls.relname IN (
        'orders',
        'products',
        'distributors',
        'routes',
        'profiles'
    )
ORDER BY cls.relname, pol.polname;

-- ============================================================================
-- Summary
-- ============================================================================
--
-- WHY THIS OPTIMIZATION MATTERS:
--
-- When using auth.uid() directly in RLS policies, Supabase's query planner
-- must re-evaluate the auth.uid() call for EVERY ROW in the table. This creates
-- an "InitPlan" that runs once per row, causing significant performance
-- degradation on large tables.
--
-- By wrapping it in (SELECT auth.uid()), the value is computed ONCE and
-- cached for the duration of the query, dramatically improving performance.
--
-- BEFORE: auth.uid()          → Re-evaluated for each row ❌
-- AFTER:  (SELECT auth.uid()) → Evaluated once, cached ✅
--
-- This optimization is especially impactful for:
-- - Tables with many rows (orders, products, routes)
-- - Queries that scan large portions of tables
-- - High-traffic endpoints with many concurrent requests
-- ============================================================================