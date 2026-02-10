# Fix Order Function Error

## Problem
Error: "Could not find the function public.create_order_with_items(...) in the schema cache"

## Solution
Run the SQL script in your Supabase SQL Editor to fix the function.

## Steps

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the content from `supabase/deploy-create-order-function.sql`
4. Run the script

The script will:
- Drop any existing version of the function
- Create the function with the correct parameter order
- Grant execute permissions
- Verify the function was created

## Verification
After running, you should see:
```
create_order_with_items(p_customer_id uuid, p_distributor_id uuid, p_order_number text, p_subtotal numeric, p_total_amount numeric, p_payment_method text, p_delivery_address_id uuid, p_delivery_address_snapshot jsonb, p_items jsonb)
```

## Test
Try creating an order again. The error should be resolved.