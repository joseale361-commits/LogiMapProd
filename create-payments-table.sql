-- Create payments table for tracking customer payments
-- This table stores all payment records for customer debts

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    distributor_id UUID NOT NULL REFERENCES public.distributors (id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'office', -- 'office', 'driver', 'transfer', 'cash'
    notes TEXT,
    created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_distributor_id ON public.payments (distributor_id);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments (customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments (payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_distributor_customer ON public.payments (distributor_id, customer_id);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Distributors can see all payments for their distributor
CREATE POLICY "Distributors can view payments" ON public.payments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.distributor_users
            WHERE
                distributor_users.user_id = auth.uid ()
                AND distributor_users.distributor_id = payments.distributor_id
                AND distributor_users.is_active = true
        )
    );

-- Distributors can insert payments for their distributor
CREATE POLICY "Distributors can insert payments" ON public.payments FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.distributor_users
            WHERE
                distributor_users.user_id = auth.uid ()
                AND distributor_users.distributor_id = payments.distributor_id
                AND distributor_users.is_active = true
        )
    );

-- Create a function to update customer_relationships.current_debt when a payment is made
CREATE OR REPLACE FUNCTION update_customer_debt_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease the customer's current debt
  UPDATE public.customer_relationships
  SET current_debt = GREATEST(0, current_debt - NEW.amount),
      updated_at = NOW()
  WHERE distributor_id = NEW.distributor_id
  AND customer_id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update debt when payment is inserted
DROP TRIGGER IF EXISTS trigger_update_debt_after_payment ON public.payments;

CREATE TRIGGER trigger_update_debt_after_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_debt_after_payment();

-- Create a function to restore customer_relationships.current_debt when a payment is deleted
CREATE OR REPLACE FUNCTION restore_customer_debt_after_payment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase the customer's current debt back
  UPDATE public.customer_relationships
  SET current_debt = current_debt + OLD.amount,
      updated_at = NOW()
  WHERE distributor_id = OLD.distributor_id
  AND customer_id = OLD.customer_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically restore debt when payment is deleted
DROP TRIGGER IF EXISTS trigger_restore_debt_after_payment_deletion ON public.payments;

CREATE TRIGGER trigger_restore_debt_after_payment_deletion
  AFTER DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION restore_customer_debt_after_payment_deletion();

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON public.payments;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.payments TO authenticated;

GRANT ALL ON public.payments TO service_role;

-- Grant usage on sequences
GRANT USAGE,
SELECT
    ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT USAGE,
SELECT
    ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMENT ON
TABLE public.payments IS 'Stores payment records for customer debts';

COMMENT ON COLUMN public.payments.payment_method IS 'Method of payment: office, driver, transfer, cash';

COMMENT ON COLUMN public.payments.amount IS 'Payment amount in local currency';

COMMENT ON COLUMN public.payments.payment_date IS 'Date when payment was made/received';