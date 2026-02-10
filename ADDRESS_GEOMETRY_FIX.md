# Fix for "parse error - invalid geometry" Error

## Problem
When trying to save a new address, the system was throwing the error:
```
Error al crear la dirección: parse error - invalid geometry
```

## Root Cause
The SQL function `create_address_with_location` had an invalid PostGIS cast syntax:
```sql
ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geometry(Geometry, 4326)
```

This cast syntax is not valid in PostGIS and causes a parse error.

## Solution
The fix involves two parts:

### 1. Update the SQL Function
Run the migration script [`supabase/fix-address-geometry.sql`](supabase/fix-address-geometry.sql) in your Supabase database:

```bash
# Using Supabase CLI
supabase db reset --db-url "your-database-url"

# Or run the SQL directly in the Supabase SQL Editor
# Copy and paste the contents of supabase/fix-address-geometry.sql
```

### 2. Updated Code Changes
The following files have been updated:

1. **[`supabase/create_address_with_location.sql`](supabase/create_address_with_location.sql)** - Fixed the invalid cast syntax
2. **[`supabase/fix-address-geometry.sql`](supabase/fix-address-geometry.sql)** - New migration script with validation
3. **[`app/(shop)/shop/[slug]/checkout/page.tsx`](app/(shop)/shop/[slug]/checkout/page.tsx)** - Simplified error handling, removed problematic fallback

## What Changed

### SQL Function
- **Before:** `ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geometry(Geometry, 4326)`
- **After:** `ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)`

### Additional Improvements
- Added coordinate validation (lat: -90 to 90, lng: -180 to 180)
- Better error messages for invalid coordinates
- Simplified error handling in the checkout page
- Removed problematic fallback code that tried to insert JSON directly into PostGIS geometry column

## How to Apply the Fix

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of [`supabase/fix-address-geometry.sql`](supabase/fix-address-geometry.sql)
4. Paste and run the SQL

### Option 2: Using Supabase CLI
```bash
supabase db push
```

### Option 3: Using psql
```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/fix-address-geometry.sql
```

## Verification
After applying the fix, try creating a new address in the checkout page. The address should be saved successfully without the "parse error - invalid geometry" error.

## Testing
1. Navigate to `/shop/[slug]/checkout`
2. Click "Agregar Nueva Dirección"
3. Fill in the address details
4. Select a location on the map
5. Click "Guardar Dirección"
6. The address should be saved successfully

## Notes
- The `location` column in the `addresses` table is a PostGIS geometry column
- PostGIS requires proper geometry objects, not JSON
- The RPC function handles the conversion from lat/lng to PostGIS geometry
- Always use the RPC function for creating addresses to ensure proper geometry handling
