-- ============================================================================
-- SCRIPT DE VERIFICACIÓN DE AUDITORÍA SUPABASE
-- ============================================================================
-- Ejecutar en Supabase SQL Editor para auditar el estado actual
-- ============================================================================

SELECT '=== VERIFICACIÓN DE RLS HABILITADO ===' as check_type;

SELECT
    tablename,
    rowsecurity as rls_enabled,
    rowchecksecurity as rls_policy_check
FROM pg_tables
WHERE
    schemaname = 'public'
ORDER BY tablename;

SELECT '' as empty_line;

SELECT '=== POLÍTICAS RLS ACTIVAS ===' as check_type;

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE (WITH CHECK)'
        WHEN 'd' THEN 'DELETE'
        ELSE cmd
    END as operation,
    pg_get_expr (polqual, polrelid) as using_clause,
    pg_get_expr (polwithcheck, polrelid) as check_clause
FROM pg_policies
WHERE
    schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '' as empty_line;

SELECT '=== ÍNDICES EXISTENTES ===' as check_type;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE
    schemaname = 'public'
ORDER BY tablename;

SELECT '' as empty_line;

SELECT '=== FOREIGN KEYS ===' as check_type;

SELECT
    conname as constraint_name,
    pg_get_constraintdef (oid) as constraint_definition
FROM pg_constraint
WHERE
    contype = 'f'
    AND connamespace = (
        SELECT oid
        FROM pg_namespace
        WHERE
            nspname = 'public'
    )
ORDER BY conname;

SELECT '' as empty_line;

SELECT '=== VERIFICACIÓN DE OPTIMIZACIÓN RLS ===' as check_type;

SELECT
    nsp.nspname as schema_name,
    cls.relname as table_name,
    pol.polname as policy_name,
    CASE pol.poltype
        WHEN 'r' THEN 'SELECT'
        WHEN 'w' THEN 'INSERT'
        WHEN 'a' THEN 'UPDATE (USING)'
        WHEN 'c' THEN 'UPDATE (WITH CHECK)'
        WHEN 'd' THEN 'DELETE'
    END as policy_type,
    CASE
        WHEN pg_get_expr (pol.polqual, pol.polrelid) LIKE '%auth.uid()%'
        AND pg_get_expr (pol.polqual, pol.polrelid) NOT LIKE '%(SELECT auth.uid())%' THEN '⚠️ NEEDS OPTIMIZATION (direct auth.uid())'
        WHEN pg_get_expr (pol.polqual, pol.polrelid) LIKE '%auth.jwt()%'
        AND pg_get_expr (pol.polqual, pol.polrelid) NOT LIKE '%(SELECT auth.jwt())%' THEN '⚠️ NEEDS OPTIMIZATION (direct auth.jwt())'
        WHEN pg_get_expr (pol.polqual, pol.polrelid) LIKE '%(SELECT auth.uid())%'
        OR pg_get_expr (pol.polqual, pol.polrelid) LIKE '%(SELECT auth.jwt())%' THEN '✅ OPTIMIZED'
        ELSE 'ℹ️ N/A'
    END as optimization_status
FROM
    pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE
    nsp.nspname = 'public'
ORDER BY cls.relname, pol.polname;

SELECT '' as empty_line;

SELECT '=== RESUMEN DE TABLAS SIN RLS ===' as check_type;

SELECT
    t.tablename,
    CASE
        WHEN p tablename IS NOT NULL THEN '✅'
        ELSE '⚠️ SIN RLS'
    END as rls_status
FROM
    pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    AND t.schemaname = p.schemaname
WHERE
    t.schemaname = 'public'
GROUP BY
    t.tablename,
    p.tablename
HAVING
    p.tablename IS NULL;

SELECT '' as empty_line;

SELECT '=== AUDITORÍA COMPLETA ===' as check_type;

SELECT
    'Tables with RLS: ' || COUNT(DISTINCT tablename)::text as metric
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
    'Total Policies: ' || COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
    'Indexes: ' || COUNT(DISTINCT indexname)::text
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
    'Foreign Keys: ' || COUNT(*)::text
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ejecutar todo el script en Supabase SQL Editor
-- 2. Revisar cada sección de resultados
-- 3. ⚠️ = Requiere atención
-- 4. ✅ = Correcto
-- ============================================================================