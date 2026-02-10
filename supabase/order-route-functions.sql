-- Function to approve an order
-- This changes the order status to 'approved' and deducts virtual stock
CREATE OR REPLACE FUNCTION approve_order(
    p_order_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_order_items RECORD;
    v_result JSONB;
BEGIN
    -- Get the order with its items
    SELECT 
        o.*,
        o.delivery_address_snapshot->>'street_address' as street_address,
        o.delivery_address_snapshot->>'city' as city
    INTO v_order
    FROM orders o
    WHERE o.id = p_order_id
    FOR UPDATE;

    -- Check if order exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order not found'
        );
    END IF;

    -- Check if order is in pending_approval status
    IF v_order.status != 'pending_approval' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order is not in pending_approval status'
        );
    END IF;

    -- Deduct virtual stock for each order item
    FOR v_order_items IN
        SELECT oi.*, pv.stock_virtual
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE oi.order_id = p_order_id
    LOOP
        -- Check if there's enough stock
        IF v_order_items.stock_virtual < v_order_items.quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock for variant: ' || v_order_items.variant_id
            );
        END IF;

        -- Deduct stock
        UPDATE product_variants
        SET stock_virtual = stock_virtual - v_order_items.quantity
        WHERE id = v_order_items.variant_id;
    END LOOP;

    -- Update order status
    UPDATE orders
    SET 
        status = 'approved',
        approved_at = NOW(),
        approved_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Return success
    SELECT 
        o.*,
        o.delivery_address_snapshot->>'street_address' as street_address,
        o.delivery_address_snapshot->>'city' as city
    INTO v_order
    FROM orders o
    WHERE o.id = p_order_id;

    v_result := jsonb_build_object(
        'success', true,
        'order', to_jsonb(v_order)
    );

    RETURN v_result;
END;
$$;

-- Function to reject an order
-- This changes the order status to 'cancelled'
CREATE OR REPLACE FUNCTION reject_order(
    p_order_id UUID,
    p_user_id UUID,
    p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_result JSONB;
BEGIN
    -- Get the order
    SELECT 
        o.*,
        o.delivery_address_snapshot->>'street_address' as street_address,
        o.delivery_address_snapshot->>'city' as city
    INTO v_order
    FROM orders o
    WHERE o.id = p_order_id
    FOR UPDATE;

    -- Check if order exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order not found'
        );
    END IF;

    -- Check if order is in pending_approval status
    IF v_order.status != 'pending_approval' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order is not in pending_approval status'
        );
    END IF;

    -- Update order status
    UPDATE orders
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        cancelled_by = p_user_id,
        cancellation_reason = p_cancellation_reason,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Return success
    SELECT 
        o.*,
        o.delivery_address_snapshot->>'street_address' as street_address,
        o.delivery_address_snapshot->>'city' as city
    INTO v_order
    FROM orders o
    WHERE o.id = p_order_id;

    v_result := jsonb_build_object(
        'success', true,
        'order', to_jsonb(v_order)
    );

    RETURN v_result;
END;
$$;

-- Function to create a route with stops
-- This creates a route and route_stops, and updates order status to 'in_transit'
CREATE OR REPLACE FUNCTION create_route_with_stops(
    p_distributor_id UUID,
    p_driver_id UUID,
    p_created_by UUID,
    p_order_ids UUID[],
    p_planned_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_route_id UUID;
    v_route_number TEXT;
    v_sequence_order INTEGER := 1;
    v_order RECORD;
    v_result JSONB;
    v_stops JSONB := '[]'::JSONB;
BEGIN
    -- Validate that we have orders
    IF p_order_ids IS NULL OR array_length(p_order_ids, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No orders provided'
        );
    END IF;

    -- Generate route number
    SELECT 'R-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('route_number_seq')::TEXT, 4, '0')
    INTO v_route_number;

    -- Create the route
    INSERT INTO routes (
        distributor_id,
        driver_id,
        created_by,
        route_number,
        planned_date,
        status,
        total_stops,
        notes,
        created_at,
        updated_at
    ) VALUES (
        p_distributor_id,
        p_driver_id,
        p_created_by,
        v_route_number,
        p_planned_date,
        'planned',
        array_length(p_order_ids, 1),
        p_notes,
        NOW(),
        NOW()
    ) RETURNING id INTO v_route_id;

    -- Create route stops for each order
    FOR v_order IN
        SELECT 
            o.id,
            o.customer_id,
            p.full_name as customer_name,
            p.phone as customer_phone,
            o.delivery_address_snapshot->>'street_address' as street_address,
            o.delivery_address_snapshot->>'city' as city,
            o.delivery_location
        FROM orders o
        JOIN profiles p ON o.customer_id = p.id
        WHERE o.id = ANY(p_order_ids)
        AND o.status = 'approved'
        ORDER BY o.created_at
    LOOP
        -- Create route stop
        INSERT INTO route_stops (
            route_id,
            order_id,
            sequence_order,
            customer_name,
            customer_phone,
            delivery_address_text,
            delivery_location,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_route_id,
            v_order.id,
            v_sequence_order,
            v_order.customer_name,
            v_order.customer_phone,
            COALESCE(v_order.street_address, '') || ', ' || COALESCE(v_order.city, ''),
            v_order.delivery_location,
            'pending',
            NOW(),
            NOW()
        );

        -- Update order status to in_transit
        UPDATE orders
        SET 
            status = 'in_transit',
            updated_at = NOW()
        WHERE id = v_order.id;

        -- Add to stops array
        v_stops := v_stops || jsonb_build_object(
            'order_id', v_order.id,
            'sequence_order', v_sequence_order,
            'customer_name', v_order.customer_name,
            'delivery_address', COALESCE(v_order.street_address, '') || ', ' || COALESCE(v_order.city, '')
        );

        v_sequence_order := v_sequence_order + 1;
    END LOOP;

    -- Return success
    v_result := jsonb_build_object(
        'success', true,
        'route_id', v_route_id,
        'route_number', v_route_number,
        'total_stops', v_sequence_order - 1,
        'stops', v_stops
    );

    RETURN v_result;
END;
$$;

-- Create sequence for route numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS route_number_seq START 1;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_order TO authenticated;

GRANT EXECUTE ON FUNCTION reject_order TO authenticated;

GRANT EXECUTE ON FUNCTION create_route_with_stops TO authenticated;