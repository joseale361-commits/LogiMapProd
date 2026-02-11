-- Staff and Drivers RLS Policies
-- This file contains RLS policies for Staff and Drivers permissions

-- 1. Permitir al Staff crear PAGOS (Registrar cobro)
DROP POLICY IF EXISTS "Staff insert payments" ON payments;

CREATE POLICY "Staff insert payments" ON payments FOR
INSERT
    TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM distributor_users
            WHERE
                user_id = auth.uid ()
                AND distributor_id = payments.distributor_id
        )
    );

-- 2. Permitir al Staff actualizar PEDIDOS (Marcar entregado)
DROP POLICY IF EXISTS "Staff update orders" ON orders;

CREATE POLICY "Staff update orders" ON orders FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM distributor_users
        WHERE
            user_id = auth.uid ()
            AND distributor_id = orders.distributor_id
    )
);

-- 3. Permitir al Staff y Drivers actualizar PARADAS (Completar parada)
DROP POLICY IF EXISTS "Drivers update stops" ON route_stops;

CREATE POLICY "Drivers update stops" ON route_stops FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM routes
        WHERE
            routes.id = route_stops.route_id
            AND (
                routes.driver_id = auth.uid () -- Es el chofer asignado
                OR EXISTS (
                    SELECT 1
                    FROM distributor_users
                    WHERE
                        user_id = auth.uid ()
                        AND distributor_id = routes.distributor_id
                ) -- O es staff de la empresa
            )
    )
);