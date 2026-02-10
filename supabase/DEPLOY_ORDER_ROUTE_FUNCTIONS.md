# Deployment Guide for Order and Route Management

This guide will help you deploy the SQL functions needed for the Order and Route Control Center.

## Prerequisites

- Access to your Supabase project's SQL Editor
- Service role key (already in `.env.local`)

## Steps to Deploy

### 1. Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query

### 2. Deploy the Functions

Copy and execute the contents of `supabase/order-route-functions.sql` in the SQL Editor.

This will create the following functions:
- `approve_order(p_order_id, p_user_id)` - Approves an order and deducts virtual stock
- `reject_order(p_order_id, p_user_id, p_cancellation_reason)` - Rejects an order
- `create_route_with_stops(p_distributor_id, p_driver_id, p_created_by, p_order_ids, p_planned_date, p_notes)` - Creates a route with stops

### 3. Verify Deployment

After executing the SQL, verify the functions were created by running:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('approve_order', 'reject_order', 'create_route_with_stops');
```

You should see all three functions listed.

### 4. Test the Functions

You can test the functions in the SQL Editor:

#### Test approve_order
```sql
SELECT approve_order(
  'your-order-id-here',
  'your-user-id-here'
);
```

#### Test reject_order
```sql
SELECT reject_order(
  'your-order-id-here',
  'your-user-id-here',
  'Test rejection reason'
);
```

#### Test create_route_with_stops
```sql
SELECT create_route_with_stops(
  'your-distributor-id-here',
  'your-driver-id-here',
  'your-user-id-here',
  ARRAY['order-id-1', 'order-id-2']::UUID[],
  '2024-01-15'::DATE,
  'Test route notes'
);
```

## Troubleshooting

### Function Not Found Error

If you get a "function not found" error:
1. Check that the function was created in the `public` schema
2. Verify the function name matches exactly (case-sensitive)
3. Check that you have the necessary permissions

### Permission Denied Error

If you get a "permission denied" error:
1. Ensure the `GRANT EXECUTE` statements at the end of the SQL file were executed
2. Check that the `authenticated` role exists in your Supabase project

### Stock Deduction Issues

If stock is not being deducted correctly:
1. Verify that `product_variants` table has the `stock_virtual` column
2. Check that the order items have valid `variant_id` values
3. Ensure the order is in `pending_approval` status before approval

## Next Steps

After deploying the functions:
1. Navigate to `/dashboard/[slug]/orders` to manage pending orders
2. Navigate to `/dashboard/[slug]/routes` to create and assign routes
3. Test the full workflow: approve orders → create routes → assign to drivers

## Notes

- The functions use `SECURITY DEFINER` to run with elevated privileges
- Stock deduction is atomic - if any item fails, the entire approval is rolled back
- Route creation automatically updates order status to `in_transit`
- All functions return JSONB for easy integration with the frontend
