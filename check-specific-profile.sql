-- ============================================
-- CHECK SPECIFIC PROFILE
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- Step 1: Check for the specific profile by email
SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  is_active,
  created_at
FROM profiles
WHERE email = 'joseale361@gmail.com';

-- Step 2: Check for the specific profile by ID
SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  is_active,
  created_at
FROM profiles
WHERE id = 'dccdb823-311f-4ab7-9290-4044b082abf8';

-- Step 3: Check ALL profiles (no filter)
SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  is_active,
  created_at
FROM profiles;

-- Step 4: Check the auth.users table
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'joseale361@gmail.com';
