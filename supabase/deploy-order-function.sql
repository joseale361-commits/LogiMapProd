-- Deploy the updated create_order_with_items function
-- Run this in your Supabase SQL editor to update the function

CREATE OR REPLACE FUNCTION create_order_with_items(
    p_customer_id UUID,
    p_distributor_id UUID,
    p_order_number TEXT,
    p_subtotal NUMERIC,
    p_total_amount NUMERIC,
    p_payment_method TEXT,
    p_delivery_address_id UUID,
    p_delivery_address_snapshot JSONB,
    p_items JSONB
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_item_count INTEGER;
BEGIN
    -- Validate inputs
    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID is required';
    END IF;
    
    IF p_distributor_id IS NULL THEN
        RAISE EXCEPTION 'Distributor ID is required';
    END IF;
    
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'At least one item is required';
    END IF;
    
    -- Start transaction (implicit in PostgreSQL function)
    
    -- Insert the order
    INSERT INTO orders (
        customer_id,
        distributor_id,
        order_number,
        subtotal,
        total_amount,
        payment_method,
        payment_status,
        status,
        delivery_address_id,
        delivery_address_snapshot,
        created_at,
        updated_at
    ) VALUES (
        p_customer_id,
        p_distributor_id,
        p_order_number,
        p_subtotal,
        p_total_amount,
        p_payment_method,
        'pending',
        'pending_approval',
        p_delivery_address_id,
        p_delivery_address_snapshot,
        NOW(),
        NOW()
    ) RETURNING id INTO v_order_id;
    
    -- Insert order items
    v_item_count := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_count := v_item_count + 1;
        
        INSERT INTO order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            pack_units,
            subtotal,
            product_snapshot,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'variant_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'pack_units')::INTEGER,
            (v_item->>'subtotal')::NUMERIC,
            v_item->'product_snapshot',
            'pending',
            NOW(),
            NOW()
        );
    END LOOP;
    
    -- Log success
    RAISE NOTICE 'Order % created with % items', v_order_id, v_item_count;
    
    -- Return the order ID
    RETURN QUERY SELECT v_order_id;
    
    -- Transaction commits automatically on success
EXCEPTION
    WHEN OTHERS THEN
        -- Transaction rolls back automatically on error
        RAISE EXCEPTION 'Error creating order: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;