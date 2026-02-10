-- ============================================
-- ADD USER TO DISTRIBUTOR
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- ============================================

-- Step 1: Check existing distributors
SELECT 
  id,
  name,
  slug,
  is_active
FROM distributors
ORDER BY name;

-- Step 2: Check the user's profile
SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  is_active
FROM profiles
WHERE email = 'joseale361@gmail.com';

-- Step 3: Add the user to a distributor
-- Replace DISTRIBUTOR_ID with the actual distributor ID from Step 1
-- Replace USER_ID with the actual user ID from Step 2

-- Example: Add user to distributor (replace the IDs below)
INSERT INTO distributor_users (
  distributor_id,
  user_id,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'YOUR_DISTRIBUTOR_ID_HERE',  -- Replace with actual distributor ID
  '3d7e446f-88dd-4f13-a381-d5798c11c0a0',  -- User ID from Step 2
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

-- ============================================
-- ALTERNATIVE: Create a new distributor for this user
-- ============================================
-- If you want to create a new distributor for this user instead:

-- Step 1: Create a new distributor
INSERT INTO distributors (
  name,
  slug,
  plan_type,
  subscription_status,
  valid_until,
  is_active,
  created_at,
  updated_at
) VALUES (
  'LogiMap Demo',  -- Business name
  'logimap-demo',  -- URL slug (must be unique)
  'basic',  -- Plan type
  'active',  -- Subscription status
  '2026-02-28',  -- Valid until (30 days from now)
  true,
  NOW(),
  NOW()
)
RETURNING id;

-- Step 2: Use the returned distributor ID to create the distributor_users relationship
INSERT INTO distributor_users (
  distributor_id,
  user_id,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'DISTRIBUTOR_ID_FROM_STEP_1',  -- Replace with the ID returned from Step 1
  '3d7e446f-88dd-4f13-a381-d5798c11c0a0',  -- User ID
  'admin',  -- Role
  true,
  NOW(),
  NOW()
);
