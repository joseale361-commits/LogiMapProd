-- ============================================
-- CREATE OR UPDATE DISTRIBUTOR WITH SLUG 'mi-tienda'
-- ============================================
-- Run this in your Supabase SQL Editor
-- ============================================

-- First, check if a distributor with slug 'mi-tienda' already exists
DO $$
DECLARE
  existing_distributor_id UUID;
BEGIN
  SELECT id INTO existing_distributor_id 
  FROM distributors 
  WHERE slug = 'mi-tienda';
  
  IF existing_distributor_id IS NOT NULL THEN
    -- Update existing distributor to ensure it's active
    UPDATE distributors 
    SET 
      is_active = true,
      name = COALESCE(name, 'Mi Tienda'),
      email = COALESCE(email, 'contacto@mitienda.com'),
      phone = COALESCE(phone, '+57 300 123 4567'),
      plan_type = COALESCE(plan_type, 'basic'),
      subscription_status = COALESCE(subscription_status, 'active'),
      valid_until = COALESCE(valid_until, '2026-12-31'),
      updated_at = NOW()
    WHERE id = existing_distributor_id;
    
    RAISE NOTICE 'Updated existing distributor with slug "mi-tienda" (ID: %)', existing_distributor_id;
  ELSE
    -- Create new distributor with slug 'mi-tienda'
    INSERT INTO distributors (
      id,
      name,
      slug,
      is_active,
      email,
      phone,
      plan_type,
      subscription_status,
      valid_until,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Mi Tienda',
      'mi-tienda',
      true,
      'contacto@mitienda.com',
      '+57 300 123 4567',
      'basic',
      'active',
      '2026-12-31',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created new distributor with slug "mi-tienda"';
  END IF;
END $$;

-- Verify the distributor was created/updated
SELECT
    id,
    name,
    slug,
    is_active,
    email,
    phone,
    plan_type,
    subscription_status,
    valid_until,
    created_at,
    updated_at
FROM distributors
WHERE
    slug = 'mi-tienda';