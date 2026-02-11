-- Fix PostgREST schema cache issue
-- Run this SQL in Supabase SQL Editor to create an RPC function for inserting payments

-- 1. Create RPC function to insert payment bypassing schema cache
CREATE OR REPLACE FUNCTION insert_payment(
    p_distributor_id UUID,
    p_customer_id UUID,
    p_amount NUMERIC(12, 2),
    p_payment_method VARCHAR(50),
    p_notes TEXT,
    p_payment_date DATE,
    p_created_by UUID,
    p_order_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    INSERT INTO public.payments (
        distributor_id,
        customer_id,
        amount,
        payment_method,
        notes,
        payment_date,
        created_by,
        order_id
    ) VALUES (
        p_distributor_id,
        p_customer_id,
        p_amount,
        p_payment_method,
        p_notes,
        p_payment_date,
        p_created_by,
        p_order_id
    )
    RETURNING id INTO v_payment_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_payment TO authenticated;

GRANT EXECUTE ON FUNCTION insert_payment TO service_role;

SELECT 'RPC function insert_payment created successfully!' as result;