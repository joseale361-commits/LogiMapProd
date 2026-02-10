-- ============================================
-- CHECK ALL DISTRIBUTORS IN DATABASE
-- ============================================
-- Run this in your Supabase SQL Editor to see all distributors
-- ============================================

SELECT
    id,
    name,
    slug,
    is_active,
    email,
    phone,
    plan_type,
    subscription_status,
    created_at
FROM distributors
ORDER BY created_at DESC;