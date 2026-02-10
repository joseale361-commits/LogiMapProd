# Address Function Deployment Guide

## Problem

The error message indicates:
```
Error al crear la direccion: Could not find the function public.create_address_with_location(...) in the schema cache
```

## Root Cause

The PostgreSQL function `create_address_with_location` does not exist in your Supabase database. While the SQL definition exists in your project files ([`supabase/create_address_with_location.sql`](supabase/create_address_with_location.sql)), it has not been executed in the database.

The code in [`app/(shop)/shop/[slug]/checkout/page.tsx`](app/(shop)/shop/[slug]/checkout/page.tsx:100) tries to call this RPC function, but it cannot find it because it hasn't been created.

## Solution

### Step 1: Execute the SQL in Supabase

You have three options to create the function in your database:

#### Option A: Use Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the sidebar menu
3. Create a new query
4. Copy the contents of [`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql)
5. Paste the SQL into the editor
6. Click **Run** to execute the script
7. Verify that confirmation messages appear in the results

#### Option B: Use Supabase CLI

If you have the Supabase CLI installed:

```bash
# Execute the script directly
supabase db execute --file supabase/deploy-address-function.sql

# Or push all migrations
supabase db push
```

#### Option C: Use psql directly

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/deploy-address-function.sql
```

### Step 2: Verify the function was created successfully

After executing the script, you should see two results in the SQL editor:

1. **"Function created successfully"** - Confirms the function was created
2. **"Permissions granted"** - Confirms permissions were assigned correctly

### Step 3: Test the functionality

1. Go to your application at `/shop/[slug]/checkout`
2. Click **"Agregar Nueva Direccion"** (Add New Address)
3. Fill in the address details
4. Select a location on the map
5. Click **"Guardar Direccion"** (Save Address)
6. The address should be saved successfully

## Files Involved

### Code Files (No changes required)

- [`app/(shop)/shop/[slug]/checkout/page.tsx`](app/(shop)/shop/[slug]/checkout/page.tsx:100) - Calls the RPC function
- [`components/shop/AddressModal.tsx`](components/shop/AddressModal.tsx:1) - Address modal component

### SQL Files (Already exist, just need to be executed)

- [`supabase/create_address_with_location.sql`](supabase/create_address_with_location.sql:1) - Original function definition
- [`supabase/fix-address-geometry.sql`](supabase/fix-address-geometry.sql:1) - Previous fix script
- [`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql:1) - **Complete deployment script (new)**

## Technical Details

### Function Signature

The function accepts the following parameters:

```sql
CREATE OR REPLACE FUNCTION public.create_address_with_location(
    p_user_id UUID,                          -- User ID
    p_label TEXT,                            -- Label (e.g., "Home", "Office")
    p_street_address TEXT,                   -- Street address
    p_city TEXT,                             -- City
    p_state TEXT,                            -- State/Department
    p_postal_code TEXT,                      -- Postal code
    p_country TEXT,                          -- Country (2-letter ISO code)
    p_lat NUMERIC,                           -- Latitude (-90 to 90)
    p_lng NUMERIC,                           -- Longitude (-180 to 180)
    p_additional_info TEXT DEFAULT NULL,     -- Additional info (optional)
    p_delivery_instructions TEXT DEFAULT NULL, -- Delivery instructions (optional)
    p_is_default BOOLEAN DEFAULT FALSE       -- Whether it's the default address
)
RETURNS JSONB
```

### Validations Implemented

The function includes validations for:
- Null coordinates
- Latitude outside valid range (-90 to 90)
- Longitude outside valid range (-180 to 180)

### Permissions

The function has execute permissions for:
- `authenticated` - Authenticated users
- `anon` - Anonymous users (for special cases)

### PostGIS

The function uses PostGIS to convert lat/lng coordinates to geometry:
```sql
ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
```

## Troubleshooting

### If the error persists after executing the SQL

1. **Verify PostGIS is installed:**
   ```sql
   SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';
   ```

2. **Verify the `addresses` table exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'addresses' 
   AND table_schema = 'public';
   ```

3. **Verify RLS permissions:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'addresses';
   ```

4. **Clear Supabase cache:**
   - In Supabase dashboard, go to Settings → API
   - Click "Reset Database Schema Cache"

### If you get PostGIS errors

If you see errors related to PostGIS, make sure the extension is installed:

```sql
-- Install PostGIS if not installed
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Summary

The problem is simple: **the SQL function does not exist in the database**. The solution is to execute the script [`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql) in your Supabase database using the SQL Editor.

No changes are required in the application code - the code is already correct and expects this function to exist in the database.
