-- Add missing columns to payments table (safe version)
-- Run this in Supabase SQL Editor

-- Step 1: Add missing columns (these use IF NOT EXISTS)
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS distributor_id UUID;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS customer_id UUID;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Step 2: Drop existing constraints if they exist
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_distributor_id_fkey;

ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_customer_id_fkey;

ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_created_by_fkey;

-- Step 3: Add foreign key constraints
ALTER TABLE public.payments
ADD CONSTRAINT payments_distributor_id_fkey FOREIGN KEY (distributor_id) REFERENCES public.distributors (id) ON DELETE SET NULL;

ALTER TABLE public.payments
ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.payments
ADD CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

SELECT 'Columns and constraints added successfully!' as result;