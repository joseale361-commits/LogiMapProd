-- ============================================
-- FIX FOR RLS POLICY VIOLATION ON PROFILES TABLE
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- ============================================

-- Step 1: Check current RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Step 2: Drop any existing restrictive policies (if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Step 3: Create proper RLS policies for the profiles table

-- Policy 1: Allow service role to bypass RLS completely (for admin operations)
CREATE POLICY "Service role bypass RLS" 
ON profiles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 2: Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = auth_user_id);

-- Policy 3: Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Step 4: Verify the policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- ALTERNATIVE SOLUTION: Disable RLS entirely
-- ============================================
-- If you don't need RLS on the profiles table, you can disable it completely:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
--
-- WARNING: This will make the profiles table accessible to anyone with the anon key
-- Only use this if you're sure you don't need row-level security
-- ============================================
