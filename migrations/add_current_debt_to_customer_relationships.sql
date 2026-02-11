-- Add current_debt column to customer_relationships table
-- This column tracks the current outstanding debt for each customer-distributor relationship

ALTER TABLE customer_relationships
ADD COLUMN IF NOT EXISTS current_debt DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN customer_relationships.current_debt IS 'Current outstanding debt amount for this customer with this distributor';

-- Optional: Create an index for better performance when querying by current_debt
CREATE INDEX IF NOT EXISTS idx_customer_relationships_current_debt ON customer_relationships (current_debt);