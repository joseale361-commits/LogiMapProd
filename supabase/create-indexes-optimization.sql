-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE RLS Y QUERIES
-- ⚠️ Estos índices mejoran significativamente el rendimiento de RLS
-- ============================================================================
-- Basado en Supabase Best Practices: query-missing-indexes.md
-- ============================================================================

-- ============================================================================
-- ÍNDICES PARA TABLA: orders
-- ============================================================================

-- Índice en distributor_id para políticas RLS
CREATE INDEX IF NOT EXISTS idx_orders_distributor_id ON orders (distributor_id);

-- Índice en customer_id para políticas RLS y queries de clientes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

-- Índice en status para filtros comunes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_orders_distributor_status ON orders (distributor_id, status);

-- ============================================================================
-- ÍNDICES PARA TABLA: products
-- ============================================================================

-- Índice en distributor_id para políticas RLS
CREATE INDEX IF NOT EXISTS idx_products_distributor_id ON products (distributor_id);

-- Índice en category_id para filtros de categoría
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

-- Índice en is_active para filtros
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);

-- ============================================================================
-- ÍNDICES PARA TABLA: route_stops
-- ============================================================================

-- Índice en route_id para JOINs y políticas RLS
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops (route_id);

-- Índice en order_id para búsquedas
CREATE INDEX IF NOT EXISTS idx_route_stops_order_id ON route_stops (order_id);

-- Índice en status para filtros
CREATE INDEX IF NOT EXISTS idx_route_stops_status ON route_stops (status);

-- ============================================================================
-- ÍNDICES PARA TABLA: distributor_users
-- ============================================================================

-- Índice en user_id para políticas RLS
CREATE INDEX IF NOT EXISTS idx_distributor_users_user_id ON distributor_users (user_id);

-- Índice en distributor_id para políticas RLS
CREATE INDEX IF NOT EXISTS idx_distributor_users_distributor_id ON distributor_users (distributor_id);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_distributor_users_user_distributor ON distributor_users (user_id, distributor_id);

-- Índice en is_active para filtros
CREATE INDEX IF NOT EXISTS idx_distributor_users_is_active ON distributor_users (is_active);

-- ============================================================================
-- ÍNDICES PARA TABLA: profiles
-- ============================================================================

-- Índice en user_id (clave primaria usualmente)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);

-- Índice en distributor_id para políticas RLS de distribuidores
CREATE INDEX IF NOT EXISTS idx_profiles_distributor_id ON profiles (distributor_id);

-- ============================================================================
-- ÍNDICES PARA TABLA: customer_relationships
-- ============================================================================

-- Índice en customer_id para políticas RLS
CREATE INDEX IF NOT EXISTS idx_customer_relationships_customer_id ON customer_relationships (customer_id);

-- Índice en distributor_id para filtros
CREATE INDEX IF NOT EXISTS idx_customer_relationships_distributor_id ON customer_relationships (distributor_id);

-- ============================================================================
-- ÍNDICES PARA TABLA: addresses
-- ============================================================================

-- Índice en user_id para políticas RLS
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);

-- ============================================================================
-- ÍNDICES PARA TABLA: payments
-- ============================================================================

-- Índice en customer_id para queries de clientes
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments (customer_id);

-- Índice en distributor_id para filtros
CREATE INDEX IF NOT EXISTS idx_payments_distributor_id ON payments (distributor_id);

-- Índice en order_id para queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);

-- ============================================================================
-- VERIFICACIÓN: Listar todos los índices creados
-- ============================================================================

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE
    schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- NOTA DE RENDIMIENTO
-- ============================================================================
-- Los índices en columnas FK (foreign key) son CRÍTICOS para RLS porque:
-- 1. Evitan Sequential Scans en tablas grandes
-- 2. Mejoran drásticamente el rendimiento de políticas RLS
-- 3. Reducen el tiempo de query de 100x-1000x en tablas grandes
-- ============================================================================