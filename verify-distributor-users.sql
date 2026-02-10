-- ============================================
-- VERIFY DISTRIBUTOR_USERS RECORD
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- Step 1: Check distributor_users for this user
SELECT 
  du.id,
  du.distributor_id,
  du.user_id,
  du.role,
  du.is_active,
  du.created_at,
  p.email,
  p.full_name,
  d.name as distributor_name,
  d.slug as distributor_slug
FROM distributor_users du
JOIN profiles p ON du.user_id = p.id
JOIN distributors d ON du.distributor_id = d.id
WHERE p.email = 'joseale361@gmail.com';

-- Step 2: Check ALL distributor_users records
SELECT 
  du.id,
  du.distributor_id,
  du.user_id,
  du.role,
  du.is_active,
  p.email,
  d.name as distributor_name
FROM distributor_users du
LEFT JOIN profiles p ON du.user_id = p.id
LEFT JOIN distributors d ON du.distributor_id = d.id;
