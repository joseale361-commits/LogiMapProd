-- ============================================
-- DEPLOYMENT SCRIPT FOR create_address_with_location
-- ============================================
-- Run this script in your Supabase SQL Editor to create the function
-- ============================================

-- Drop the existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.create_address_with_location CASCADE;

-- Create the function with correct PostGIS syntax
CREATE OR REPLACE FUNCTION public.create_address_with_location(
    p_user_id UUID,
    p_label TEXT,
    p_street_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_postal_code TEXT,
    p_country TEXT,
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_additional_info TEXT DEFAULT NULL,
    p_delivery_instructions TEXT DEFAULT NULL,
    p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_address_id UUID;
    v_result JSONB;
BEGIN
    -- Validate coordinates
    IF p_lat IS NULL OR p_lng IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Coordinates cannot be NULL'
        );
    END IF;

    IF p_lat < -90 OR p_lat > 90 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Invalid latitude value. Must be between -90 and 90'
        );
    END IF;

    IF p_lng < -180 OR p_lng > 180 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Invalid longitude value. Must be between -180 and 180'
        );
    END IF;

    -- Insert the address with proper PostGIS geometry
    INSERT INTO public.addresses (
        user_id,
        label,
        street_address,
        city,
        state,
        postal_code,
        country,
        additional_info,
        delivery_instructions,
        location,
        is_default,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_label,
        p_street_address,
        p_city,
        p_state,
        p_postal_code,
        p_country,
        p_additional_info,
        p_delivery_instructions,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
        p_is_default,
        TRUE,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_address_id;

    -- If this is set as default, unset other default addresses for this user
    IF p_is_default THEN
        UPDATE public.addresses
        SET is_default = FALSE
        WHERE user_id = p_user_id
        AND id != v_address_id;
    END IF;

    -- Return the created address
    SELECT jsonb_build_object(
        'success', TRUE,
        'data', to_jsonb(a)
    ) INTO v_result
    FROM public.addresses a
    WHERE a.id = v_address_id;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details for debugging
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT
EXECUTE ON FUNCTION public.create_address_with_location TO authenticated;

GRANT
EXECUTE ON FUNCTION public.create_address_with_location TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_address_with_location IS 'Creates a new address with PostGIS geometry from lat/lng coordinates. Handles default address logic automatically.';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify the function was created successfully
SELECT
    'Function created successfully' as status,
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE
    routine_schema = 'public'
    AND routine_name = 'create_address_with_location';

-- Verify permissions
SELECT
    'Permissions granted' as status,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE
    routine_schema = 'public'
    AND routine_name = 'create_address_with_location';