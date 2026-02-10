-- ============================================
-- FIX MISSING DISTRIBUTOR_USERS RECORD
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- ============================================

-- Step 1: Check the user's profile
SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  is_active
FROM profiles
WHERE email = 'joseale361@gmail.com';

-- Step 2: Check all distributors
SELECT 
  id,
  name,
  slug,
  is_active,
  subscription_status
FROM distributors
ORDER BY created_at DESC;

-- Step 3: Create the distributor_users relationship
-- Replace DISTRIBUTOR_ID with the actual distributor ID from Step 2
-- The user ID is: dccdb823-311f-4ab7-9290-4044b082abf8

INSERT INTO distributor_users (
  distributor_id,
  user_id,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'YOUR_DISTRIBUTOR_ID_HERE',  -- Replace with the distributor ID from Step 2
  'dccdb823-311f-4ab7-9290-4044b082abf8',  -- User ID from Step 1
  'admin',  -- Role: 'admin', 'manager', or 'user'
  true,
  NOW(),
  NOW()
);

-- Step 4: Verify the relationship was created
SELECT 
  du.id,
  du.role,
  du.is_active,
  p.email,
  p.full_name,
  d.name as distributor_name,
  d.slug as distributor_slug
FROM distributor_users du
JOIN profiles p ON du.user_id = p.id
JOIN distributors d ON du.distributor_id = d.id
WHERE p.email = 'joseale361@gmail.com';
