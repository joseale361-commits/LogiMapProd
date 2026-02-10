# Fix for PostgreSQL Parameter Order Error

## Error Encountered

```
Error: Failed to run sql query: ERROR: 42P13: input parameters after one with a default value must also have defaults
```

## Root Cause

In PostgreSQL, once you specify a default value for a function parameter, **all subsequent parameters must also have default values**.

The original function had this parameter order:
```sql
CREATE OR REPLACE FUNCTION create_address_with_location(
    p_user_id UUID,
    p_label TEXT,
    p_street_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_postal_code TEXT,
    p_country TEXT,
    p_additional_info TEXT DEFAULT NULL,     -- Has default
    p_delivery_instructions TEXT DEFAULT NULL, -- Has default
    p_lat NUMERIC,                           -- NO DEFAULT - ERROR!
    p_lng NUMERIC,                           -- NO DEFAULT - ERROR!
    p_is_default BOOLEAN DEFAULT FALSE       -- Has default
)
```

This is invalid because `p_lat` and `p_lng` (required parameters) come after `p_additional_info` and `p_delivery_instructions` (optional parameters with defaults).

## Solution

Reordered the parameters so that all required parameters come first, and all optional parameters (with defaults) come at the end:

```sql
CREATE OR REPLACE FUNCTION create_address_with_location(
    p_user_id UUID,                          -- Required
    p_label TEXT,                            -- Required
    p_street_address TEXT,                   -- Required
    p_city TEXT,                             -- Required
    p_state TEXT,                            -- Required
    p_postal_code TEXT,                      -- Required
    p_country TEXT,                          -- Required
    p_lat NUMERIC,                           -- Required
    p_lng NUMERIC,                           -- Required
    p_additional_info TEXT DEFAULT NULL,     -- Optional
    p_delivery_instructions TEXT DEFAULT NULL, -- Optional
    p_is_default BOOLEAN DEFAULT FALSE       -- Optional
)
```

## Files Updated

1. **[`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql:9)** - Main deployment script
2. **[`supabase/create_address_with_location.sql`](supabase/create_address_with_location.sql:5)** - Original function definition
3. **[`supabase/fix-address-geometry.sql`](supabase/fix-address-geometry.sql:9)** - Fix script
4. **[`app/(shop)/shop/[slug]/checkout/page.tsx`](app/(shop)/shop/[slug]/checkout/page.tsx:100)** - Updated to pass parameters in new order
5. **[`ADDRESS_FUNCTION_DEPLOYMENT_GUIDE.md`](ADDRESS_FUNCTION_DEPLOYMENT_GUIDE.md:1)** - Updated documentation

## Next Steps

Now you can execute the corrected SQL script:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of [`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql)
5. Paste and run the script
6. The function should be created successfully

## Parameter Order Reference

When calling the function from TypeScript/JavaScript, use this order:

```typescript
await supabase.rpc('create_address_with_location', {
    p_user_id: userId,
    p_label: 'Home',
    p_street_address: '123 Main St',
    p_city: 'Bogota',
    p_state: 'CI',
    p_postal_code: '110111',
    p_country: 'CO',
    p_lat: 4.7110,
    p_lng: -74.0721,
    p_additional_info: 'Apartment 4B',  // Optional
    p_delivery_instructions: 'Ring twice', // Optional
    p_is_default: true                    // Optional
});
```
