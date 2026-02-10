-- ============================================
-- DEBUG ID MISMATCH
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- Step 1: Check ALL profiles
SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  is_active
FROM profiles
ORDER BY created_at DESC;

-- Step 2: Check ALL distributor_users
SELECT 
  id,
  distributor_id,
  user_id,
  role,
  is_active,
  created_at
FROM distributor_users
ORDER BY created_at DESC;

-- Step 3: Check for any orphaned records (distributor_users without matching profile)
SELECT 
  du.id,
  du.user_id,
  du.distributor_id,
  du.role,
  du.is_active
FROM distributor_users du
LEFT JOIN profiles p ON du.user_id = p.id
WHERE p.id IS NULL;

-- Step 4: Check for profiles without distributor_users
SELECT 
  p.id,
  p.auth_user_id,
  p.email,
  p.full_name
FROM profiles p
LEFT JOIN distributor_users du ON p.id = du.user_id
WHERE du.id IS NULL;

-- Step 5: Check if there are multiple profiles for the same email
SELECT 
  email,
  COUNT(*) as profile_count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;
