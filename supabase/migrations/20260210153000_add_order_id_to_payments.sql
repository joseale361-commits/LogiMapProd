-- Add order_id column to payments table to track which order the payment belongs to

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_id UUID;

-- Add foreign key constraint
ALTER TABLE public.payments
ADD CONSTRAINT IF NOT EXISTS payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);

-- Grant necessary permissions
GRANT USAGE,
SELECT
    ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT USAGE,
SELECT
    ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMENT ON COLUMN public.payments.order_id IS 'Reference to the order this payment is associated with';