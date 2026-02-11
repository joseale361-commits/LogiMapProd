-- =====================================================
-- MIGRATION: Advanced Logistics & CRM Features
-- Date: 2026-02-07
-- Author: DBA Senior
-- Description: Schema evolution for pickup support,
--              flexible payments, CRM features, and roles
-- =====================================================

-- =====================================================
-- SECTION 1: SOPORTE PICKUP
-- =====================================================

-- Agregar delivery_type a orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'delivery' NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN orders.delivery_type IS 'Type of delivery: delivery or pickup';

-- Agregar pickup_time a orders (opcional)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP NULL;

-- Agregar comentario
COMMENT ON COLUMN orders.pickup_time IS 'Scheduled pickup time for pickup orders';

-- Agregar constraint para validar delivery_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_delivery_type_check'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT orders_delivery_type_check 
        CHECK (delivery_type IN ('delivery', 'pickup'));
    END IF;
END $$;

-- =====================================================
-- SECTION 2: FINANZAS FLEXIBLES (ABONOS)
-- =====================================================

-- Agregar initial_payment a orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS initial_payment DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN orders.initial_payment IS 'Initial payment or down payment amount';

-- Agregar balance_due a orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN orders.balance_due IS 'Remaining balance to be paid (auto-calculated)';

-- Crear/Reemplazar función para calcular balance_due
CREATE OR REPLACE FUNCTION calculate_order_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular balance_due = total_amount - initial_payment
    NEW.balance_due := COALESCE(NEW.total_amount, 0) - COALESCE(NEW.initial_payment, 0);
    
    -- Asegurar que balance_due no sea negativo
    IF NEW.balance_due < 0 THEN
        NEW.balance_due := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para calcular balance_due en INSERT
DROP TRIGGER IF EXISTS trigger_calculate_balance_on_insert ON orders;

CREATE TRIGGER trigger_calculate_balance_on_insert
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_balance();

-- Crear trigger para calcular balance_due en UPDATE
DROP TRIGGER IF EXISTS trigger_calculate_balance_on_update ON orders;

CREATE TRIGGER trigger_calculate_balance_on_update
    BEFORE UPDATE OF total_amount, initial_payment ON orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_balance();

-- Actualizar registros existentes con balance_due correcto
UPDATE orders
SET
    balance_due = COALESCE(total_amount, 0) - COALESCE(initial_payment, 0)
WHERE
    balance_due != (
        COALESCE(total_amount, 0) - COALESCE(initial_payment, 0)
    );

-- =====================================================
-- SECTION 3: CRM DE CLIENTES
-- =====================================================

-- Agregar last_visit_at a customer_relationships
ALTER TABLE customer_relationships
ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMP NULL;

-- Agregar comentario
COMMENT ON COLUMN customer_relationships.last_visit_at IS 'Last visit or order date for this customer';

-- Agregar visit_frequency_days a customer_relationships
ALTER TABLE customer_relationships
ADD COLUMN IF NOT EXISTS visit_frequency_days INTEGER DEFAULT 7 NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN customer_relationships.visit_frequency_days IS 'Expected frequency of visits in days (for route planning)';

-- Agregar zone_name a addresses
ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS zone_name VARCHAR(100) NULL;

-- Agregar comentario
COMMENT ON COLUMN addresses.zone_name IS 'Neighborhood or zone name for grouping addresses';

-- Crear índice para optimizar búsquedas por zona
CREATE INDEX IF NOT EXISTS idx_addresses_zone_name ON addresses (zone_name)
WHERE
    zone_name IS NOT NULL;

-- =====================================================
-- SECTION 4: ROLES FLEXIBLES
-- =====================================================

-- Agregar columna is_driver a distributor_users
ALTER TABLE distributor_users
ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT false NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN distributor_users.is_driver IS 'Indicates if this user is assigned as a driver for routes';

-- Eliminar constraint existente de role (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'distributor_users_role_check'
    ) THEN
        ALTER TABLE distributor_users 
        DROP CONSTRAINT distributor_users_role_check;
    END IF;
END $$;

-- Crear nuevo constraint con 'staff' incluido
ALTER TABLE distributor_users
ADD CONSTRAINT distributor_users_role_check CHECK (
    role IN (
        'admin',
        'manager',
        'driver',
        'staff',
        'sales'
    )
);

-- Migrar usuarios con role='driver' a tener is_driver=true
UPDATE distributor_users
SET
    is_driver = true
WHERE
    role = 'driver'
    AND is_driver = false;

-- =====================================================
-- SECTION 5: ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para orders por delivery_type
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders (delivery_type);

-- Índice para orders con pickup_time pendiente
CREATE INDEX IF NOT EXISTS idx_orders_pickup_time ON orders (pickup_time)
WHERE
    pickup_time IS NOT NULL
    AND status != 'delivered';

-- Índice para customer_relationships por última visita
CREATE INDEX IF NOT EXISTS idx_customer_relationships_last_visit ON customer_relationships (last_visit_at DESC);

-- Índice para distributor_users drivers activos
CREATE INDEX IF NOT EXISTS idx_distributor_users_drivers ON distributor_users (distributor_id, is_driver)
WHERE
    is_driver = true
    AND is_active = true;

-- =====================================================
-- SECTION 6: ACTUALIZACIÓN DE DATOS EXISTENTES
-- =====================================================

-- Inicializar last_visit_at con la fecha del último pedido
UPDATE customer_relationships cr
SET
    last_visit_at = (
        SELECT MAX(o.created_at)
        FROM orders o
        WHERE
            o.customer_id = cr.customer_id
            AND o.distributor_id = cr.distributor_id
    )
WHERE
    last_visit_at IS NULL;

-- =====================================================
-- SECTION 7: VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar que todas las columnas fueron agregadas
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_type') THEN
        missing_columns := array_append(missing_columns, 'orders.delivery_type');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='pickup_time') THEN
        missing_columns := array_append(missing_columns, 'orders.pickup_time');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='initial_payment') THEN
        missing_columns := array_append(missing_columns, 'orders.initial_payment');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='balance_due') THEN
        missing_columns := array_append(missing_columns, 'orders.balance_due');
    END IF;
    
    -- Verificar customer_relationships
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_relationships' AND column_name='last_visit_at') THEN
        missing_columns := array_append(missing_columns, 'customer_relationships.last_visit_at');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_relationships' AND column_name='visit_frequency_days') THEN
        missing_columns := array_append(missing_columns, 'customer_relationships.visit_frequency_days');
    END IF;
    
    -- Verificar addresses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='zone_name') THEN
        missing_columns := array_append(missing_columns, 'addresses.zone_name');
    END IF;
    
    -- Verificar distributor_users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributor_users' AND column_name='is_driver') THEN
        missing_columns := array_append(missing_columns, 'distributor_users.is_driver');
    END IF;
    
    -- Reportar resultados
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Migration incomplete. Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'Migration completed successfully. All columns added.';
    END IF;
END $$;

-- Mostrar resumen de cambios
SELECT 
    'orders' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN delivery_type = 'pickup' THEN 1 END) as pickup_orders,
    COUNT(CASE WHEN balance_due > 0 THEN 1 END) as orders_with_balance
FROM orders
UNION ALL
SELECT 
    'customer_relationships',
    COUNT(*),
    COUNT(CASE WHEN last_visit_at IS NOT NULL THEN 1 END),
    NULL
FROM customer_relationships
UNION ALL
SELECT 
    'addresses',
    COUNT(*),
    COUNT(CASE WHEN zone_name IS NOT NULL THEN 1 END),
    NULL
FROM addresses
UNION ALL
SELECT 
    'distributor_users',
    COUNT(*),
    COUNT(CASE WHEN is_driver = true THEN 1 END),
    NULL
FROM distributor_users;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

-- NOTAS IMPORTANTES:
-- 1. Este script es idempotente (puede ejecutarse múltiples veces sin problemas)
-- 2. Todos los ALTER TABLE usan IF NOT EXISTS para evitar errores
-- 3. Los triggers se recrean (DROP IF EXISTS + CREATE)
-- 4. Los datos existentes se actualizan automáticamente
-- 5. Se incluyen índices para optimizar consultas comunes
-- 6. Se incluye verificación post-migración

-- ROLLBACK (si es necesario):
-- Para revertir esta migración, ejecutar:
-- ALTER TABLE orders DROP COLUMN IF EXISTS delivery_type CASCADE;
-- ALTER TABLE orders DROP COLUMN IF EXISTS pickup_time CASCADE;
-- ALTER TABLE orders DROP COLUMN IF EXISTS initial_payment CASCADE;
-- ALTER TABLE orders DROP COLUMN IF EXISTS balance_due CASCADE;
-- DROP TRIGGER IF EXISTS trigger_calculate_balance_on_insert ON orders;
-- DROP TRIGGER IF EXISTS trigger_calculate_balance_on_update ON orders;
-- DROP FUNCTION IF EXISTS calculate_order_balance() CASCADE;
-- ALTER TABLE customer_relationships DROP COLUMN IF EXISTS last_visit_at CASCADE;
-- ALTER TABLE customer_relationships DROP COLUMN IF EXISTS visit_frequency_days CASCADE;
-- ALTER TABLE addresses DROP COLUMN IF EXISTS zone_name CASCADE;
-- ALTER TABLE distributor_users DROP COLUMN IF EXISTS is_driver CASCADE;