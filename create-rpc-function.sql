-- ============================================
-- CREATE RPC FUNCTION TO GET DISTRIBUTOR USERS
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- Create the RPC function
CREATE OR REPLACE FUNCTION get_distributor_users(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  distributor_id UUID,
  user_id UUID,
  role VARCHAR(50),
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distributor_name VARCHAR(255),
  distributor_slug VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    du.id,
    du.distributor_id,
    du.user_id,
    du.role,
    du.is_active,
    du.created_at,
    du.updated_at,
    d.name as distributor_name,
    d.slug as distributor_slug
  FROM distributor_users du
  JOIN distributors d ON du.distributor_id = d.id
  WHERE du.user_id = p_user_id;
END;
$$;

-- Test the function
SELECT * FROM get_distributor_users('dccdb823-311f-4ab7-9290-4044b082abf8');
