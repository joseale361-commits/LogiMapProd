-- Add invoice_number column to orders table
-- This column stores the external POS/Invoice number when an order is approved

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders (invoice_number)
WHERE
    invoice_number IS NOT NULL;

COMMENT ON COLUMN orders.invoice_number IS 'Número de Factura/POS externo asignado al aprobar el pedido';