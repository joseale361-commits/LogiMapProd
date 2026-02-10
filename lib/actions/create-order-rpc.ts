/**
 * Script to create the create_order_with_items RPC function in Supabase.
 * Updated for the new schema (shops, variants, line_total, price_at_sale).
 */

import { adminClient } from '@/lib/supabase/admin';

const sql = `
-- Create a function to create an order with its items in a transaction
DROP FUNCTION IF EXISTS create_order_with_items(UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS create_order_with_items(UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION create_order_with_items(
    p_customer_id UUID,
    p_shop_id UUID,
    p_order_number TEXT,
    p_subtotal NUMERIC,
    p_total NUMERIC,
    p_channel TEXT,
    p_shipping_address TEXT,
    p_items JSONB
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
BEGIN
    -- Insert the order
    INSERT INTO orders (
        customer_id,
        shop_id,
        order_number,
        subtotal,
        total,
        channel,
        status,
        shipping_address,
        created_at,
        updated_at
    ) VALUES (
        p_customer_id,
        p_shop_id,
        p_order_number,
        p_subtotal,
        p_total,
        p_channel::channel_enum,
        'pending'::order_status_enum,
        p_shipping_address,
        NOW(),
        NOW()
    ) RETURNING id INTO v_order_id;
    
    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            shop_id,
            variant_id,
            quantity,
            price_at_sale,
            line_total,
            product_name,
            variant_sku,
            variant_attributes,
            created_at,
            updated_at
        ) VALUES (
            v_order_id,
            p_shop_id,
            (v_item->>'variant_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price_at_sale')::NUMERIC,
            (v_item->>'line_total')::NUMERIC,
            v_item->>'product_name',
            v_item->>'variant_sku',
            COALESCE(v_item->'variant_attributes', '{}'::JSONB),
            NOW(),
            NOW()
        );
    END LOOP;
    
    -- Return the order ID
    RETURN QUERY SELECT v_order_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
`;

// Helper to run this via MCP or manual SQL editor
export async function createRPCFunction() {
    console.log('[RPC] Please run the following SQL in your Supabase SQL Editor:');
    console.log('---');
    console.log(sql);
    console.log('---');
}

if (require.main === module) {
    createRPCFunction();
}
