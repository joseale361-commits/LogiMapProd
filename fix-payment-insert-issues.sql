-- Fix payment insertion issues
-- Run this SQL in Supabase SQL Editor

-- 1. Add order_id column if it doesn't exist
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_id UUID;

-- 2. Fix the trigger function to handle missing customer_relationships
CREATE OR REPLACE FUNCTION update_customer_debt_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease the customer's current debt only if relationship exists
  UPDATE public.customer_relationships
  SET current_debt = GREATEST(0, current_debt - NEW.amount),
      updated_at = NOW()
  WHERE distributor_id = NEW.distributor_id
  AND customer_id = NEW.customer_id;
  
  -- If no row was updated (relationship doesn't exist), silently continue
  IF NOT FOUND THEN
    RAISE NOTICE 'No customer_relationships found for distributor_id % and customer_id %', NEW.distributor_id, NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_debt_after_payment ON public.payments;

CREATE TRIGGER trigger_update_debt_after_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_debt_after_payment();

-- 4. Ensure RLS policies are correct for service_role (bypass)
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS but allow service_role to bypass
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create bypass policy for service_role
CREATE POLICY \"Service role can bypass RLS\" ON public.payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Grant permissions
GRANT ALL ON public.payments TO service_role;

GRANT ALL ON public.payments TO authenticated;

SELECT 'Payment fix applied successfully!' as result;