-- ============================================================================
-- CORRECCIÓN RLS PARA addresses TABLE
-- ⚠️ ANTES DE EJECUTAR: Verificar el nombre de la columna en tu tabla
-- ============================================================================
-- Este archivo corrige un bug crítico en setup-addresses-rls.sql original
-- donde se usaba 'customer_id' en lugar de 'user_id'
-- ============================================================================

-- Verificar columnas en la tabla addresses
-- Ejecutar primero para ver qué columnas existen:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'addresses';

-- Si la columna es 'user_id' (más común), ejecutar esto:
-- ============================================================================

-- Paso 1: Habilitar RLS si no está habilitado
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;

DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;

-- Paso 3: Crear políticas correctas usando 'user_id'
-- Nota: Si tu columna se llama 'customer_id', cambiar 'user_id' por 'customer_id'

-- Política 1: Usuarios pueden VER sus propias direcciones
CREATE POLICY "Users can view their own addresses" ON addresses FOR
SELECT TO authenticated USING (auth.uid () = user_id);

-- Política 2: Usuarios pueden CREAR sus propias direcciones
CREATE POLICY "Users can insert their own addresses" ON addresses FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = user_id);

-- Política 3: Usuarios pueden ACTUALIZAR sus propias direcciones
CREATE POLICY "Users can update their own addresses" ON addresses FOR
UPDATE TO authenticated USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

-- Política 4: Usuarios pueden ELIMINAR sus propias direcciones
CREATE POLICY "Users can delete their own addresses" ON addresses FOR DELETE TO authenticated USING (auth.uid () = user_id);

-- Paso 4: Verificar que las políticas se crearon correctamente
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    pg_get_expr (polqual, polrelid) as using_clause,
    pg_get_expr (polwithcheck, polrelid) as check_clause
FROM pg_policies
WHERE
    tablename = 'addresses'
ORDER BY policyname;

-- ============================================================================
-- NOTA: Si tu tabla addresses tiene una columna diferente (ej: customer_id),
--，你需要修改 las políticas arriba cambiando 'user_id' por el nombre correcto.
-- ============================================================================