-- ============================================
-- CHECK DISTRIBUTOR_USERS RECORD STATE
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- Step 1: Check the distributor_users record for this user
SELECT 
  du.id,
  du.distributor_id,
  du.user_id,
  du.role,
  du.is_active,
  du.created_at,
  du.updated_at,
  p.email,
  p.full_name,
  d.name as distributor_name,
  d.slug as distributor_slug
FROM distributor_users du
JOIN profiles p ON du.user_id = p.id
JOIN distributors d ON du.distributor_id = d.id
WHERE p.email = 'joseale361@gmail.com';

-- Step 2: Check if is_active is the issue
SELECT 
  du.id,
  du.distributor_id,
  du.user_id,
  du.role,
  du.is_active,
  CASE 
    WHEN du.is_active IS NULL THEN 'NULL'
    WHEN du.is_active = false THEN 'FALSE'
    WHEN du.is_active = true THEN 'TRUE'
    ELSE 'UNKNOWN'
  END as is_active_status,
  p.email,
  d.name as distributor_name
FROM distributor_users du
JOIN profiles p ON du.user_id = p.id
JOIN distributors d ON du.distributor_id = d.id
WHERE p.email = 'joseale361@gmail.com';

-- Step 3: If is_active is false or null, update it to true
-- Run this ONLY if Step 2 shows is_active is false or null
UPDATE distributor_users
SET is_active = true,
    updated_at = NOW()
WHERE user_id = 'dccdb823-311f-4ab7-9290-4044b082abf8'
  AND distributor_id = '38d49ff8-c266-4e2a-a4cf-380059832bab';

-- Step 4: Verify the update
SELECT 
  du.id,
  du.distributor_id,
  du.user_id,
  du.role,
  du.is_active,
  p.email,
  d.name as distributor_name,
  d.slug as distributor_slug
FROM distributor_users du
JOIN profiles p ON du.user_id = p.id
JOIN distributors d ON du.distributor_id = d.id
WHERE p.email = 'joseale361@gmail.com';
