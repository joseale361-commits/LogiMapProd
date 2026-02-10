-- Update test distributor to have valid subscription
-- Run this in Supabase SQL Editor to fix your test distributor

UPDATE distributors
SET
    subscription_status = 'active',
    valid_until = NOW() + INTERVAL '1 year',
    is_active = true
WHERE
    slug = 'mi-tienda' -- Replace with your test distributor's slug
    OR name LIKE '%test%'
    OR name LIKE '%prueba%';

-- Verify the update
SELECT
    id,
    name,
    slug,
    is_active,
    subscription_status,
    valid_until
FROM distributors
WHERE
    is_active = true;