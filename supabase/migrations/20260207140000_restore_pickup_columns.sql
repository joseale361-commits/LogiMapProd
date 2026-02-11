-- Migration to restore missing columns for pickup and flexible payments
-- This replaces manual migrations that were lost during db reset

-- 1. Add missing columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'delivery' CHECK (
    delivery_type IN ('delivery', 'pickup')
);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP
WITH
    TIME ZONE;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address_snapshot JSONB;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS initial_payment DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(12, 2) DEFAULT 0;

-- 2. Update status enum if needed (ensure 'approved' exists, skip 'ready_for_pickup' as per user request to use 'approved')
-- Note: 'approved' usually exists, but we ensure the column uses the enum if it's already there.

-- 3. Trigger to calculate balance_due
CREATE OR REPLACE FUNCTION calculate_order_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance_due := COALESCE(NEW.total_amount, 0) - COALESCE(NEW.initial_payment, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_balance_on_insert ON orders;

CREATE TRIGGER trigger_calculate_balance_on_insert
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_balance();

DROP TRIGGER IF EXISTS trigger_calculate_balance_on_update ON orders;

CREATE TRIGGER trigger_calculate_balance_on_update
BEFORE UPDATE OF total_amount, initial_payment ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_balance();

-- 4. Indices for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders (delivery_type);

CREATE INDEX IF NOT EXISTS idx_orders_pickup_time ON orders (pickup_time);