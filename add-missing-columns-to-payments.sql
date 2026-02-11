-- Add missing columns to payments table
-- Run this SQL in Supabase SQL Editor (run step by step)

-- Step 1: Add missing columns (these support IF NOT EXISTS)
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS distributor_id UUID;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS customer_id UUID;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Step 2: Drop existing foreign keys if they exist (PostgreSQL < 15 doesn't support IF NOT EXISTS for ALTER TABLE ADD CONSTRAINT)
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

-- Step 4: Create indexes
DROP INDEX IF EXISTS idx_payments_distributor_id;

DROP INDEX IF EXISTS idx_payments_customer_id;

DROP INDEX IF EXISTS idx_payments_created_by;

DROP INDEX IF EXISTS idx_payments_payment_date;

CREATE INDEX idx_payments_distributor_id ON public.payments (distributor_id);

CREATE INDEX idx_payments_customer_id ON public.payments (customer_id);

CREATE INDEX idx_payments_created_by ON public.payments (created_by);

CREATE INDEX idx_payments_payment_date ON public.payments (payment_date);

SELECT 'Missing columns added to payments table successfully!' as result;