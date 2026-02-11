-- Fix payments table schema to match application code
-- Run this SQL in Supabase SQL Editor to add missing columns

-- Add missing columns if they don't exist
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS distributor_id UUID;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS customer_id UUID;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Add foreign key constraints
ALTER TABLE public.payments
ADD CONSTRAINT IF NOT EXISTS payments_distributor_id_fkey FOREIGN KEY (distributor_id) REFERENCES public.distributors (id) ON DELETE SET NULL;

ALTER TABLE public.payments
ADD CONSTRAINT IF NOT EXISTS payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.payments
ADD CONSTRAINT IF NOT EXISTS payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_distributor_id ON public.payments (distributor_id);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments (customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_created_by ON public.payments (created_by);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments (payment_date);

-- Grant necessary permissions
GRANT USAGE,
SELECT
    ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT USAGE,
SELECT
    ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Comment on columns
COMMENT ON COLUMN public.payments.distributor_id IS 'Reference to the distributor this payment belongs to';

COMMENT ON COLUMN public.payments.customer_id IS 'Reference to the customer who made the payment';

COMMENT ON COLUMN public.payments.created_by IS 'Reference to the user who created this payment record';

COMMENT ON COLUMN public.payments.payment_date IS 'Date when payment was made/received';

SELECT 'Payments table columns added successfully!' as result;