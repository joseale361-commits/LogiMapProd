# Address Creation and Geolocation Fixes

## Issues Fixed

### 1. Address Creation Error
**Problem:** The error `Error creating address: {}` was appearing when trying to save an address, with no useful error details.

**Root Causes:**
- The RPC function `create_address_with_location` might not exist or have permission issues
- Error handling was not providing enough information to diagnose the problem
- The PostGIS geometry handling might be causing issues

**Solutions Implemented:**

#### a) Enhanced Error Logging
Added comprehensive logging in [`app/(shop)/shop/[slug]/checkout/page.tsx`](app/(shop)/shop/[slug]/checkout/page.tsx:75-145):
- Logs all address data before creation
- Logs RPC response with full error details
- Provides user-friendly error messages

#### b) Fallback Mechanism
Implemented a fallback approach that:
1. First tries to use the RPC function `create_address_with_location`
2. If RPC fails, falls back to direct database insert
3. Uses JSON format for location data in the fallback
4. Provides detailed error messages for both attempts

### 2. Geolocation Button Not Working
**Problem:** The "Usar mi ubicación" (Use my location) button was not functioning properly.

**Root Causes:**
- Insufficient error handling for geolocation API
- No timeout configuration
- Generic error messages that didn't help users understand the issue

**Solutions Implemented:**

#### a) Enhanced Geolocation Error Handling
Updated [`components/shop/AddressModal.tsx`](components/shop/AddressModal.tsx:90-118):
- Added detailed logging for geolocation attempts
- Implemented specific error messages for different error codes:
  - `PERMISSION_DENIED`: User denied location access
  - `POSITION_UNAVAILABLE`: Location information unavailable
  - `TIMEOUT`: Request timed out
- Added timeout configuration (10 seconds)
- Added `maximumAge: 0` to ensure fresh location data

#### b) Improved Map Rendering
- Added background color to map container for better visual feedback
- Ensured map container has proper styling

## Files Modified

1. **[`app/(shop)/shop/[slug]/checkout/page.tsx`](app/(shop)/shop/[slug]/checkout/page.tsx)**
   - Enhanced `handleCreateAddress` function with fallback mechanism
   - Added comprehensive error logging
   - Improved error messages for users

2. **[`components/shop/AddressModal.tsx`](components/shop/AddressModal.tsx)**
   - Enhanced `handleGetCurrentLocation` function
   - Added specific error handling for different geolocation error codes
   - Improved map container styling

3. **[`supabase/verify-address-function.sql`](supabase/verify-address-function.sql)** (New)
   - Created verification script to check RPC function status
   - Checks function existence, permissions, and PostGIS extension

## Testing Instructions

### 1. Test Address Creation
1. Navigate to the checkout page
2. Click "Agregar Nueva Dirección"
3. Fill in all required fields:
   - Etiqueta (Label)
   - Ciudad (City)
   - Dirección (Street Address)
   - Departamento (State)
4. Either:
   - Click "Usar mi ubicación" to get current location, OR
   - Manually position the marker on the map
5. Click "Guardar Dirección"
6. Check the browser console for detailed logs

### 2. Test Geolocation Button
1. Open the address modal
2. Click "Usar mi ubicación"
3. Allow location access when prompted by the browser
4. Verify the map updates to your current location
5. Check the browser console for any errors

### 3. Verify Database Function
Run the verification script in your Supabase SQL editor:
```sql
-- Copy and run the contents of supabase/verify-address-function.sql
```

This will show:
- If the RPC function exists
- Function permissions
- PostGIS extension status
- Addresses table structure
- RLS policies

## Troubleshooting

### If Address Creation Still Fails

1. **Check Browser Console:**
   - Look for detailed error messages
   - Check if RPC function is being called
   - Verify if fallback is being used

2. **Verify Database Setup:**
   - Run the verification script
   - Ensure PostGIS extension is installed
   - Check RLS policies on addresses table

3. **Check User Authentication:**
   - Ensure user is logged in
   - Verify user has proper permissions

### If Geolocation Still Doesn't Work

1. **Check Browser Permissions:**
   - Ensure location access is allowed
   - Check browser settings for location permissions

2. **Check HTTPS:**
   - Geolocation requires HTTPS or localhost
   - If testing on a custom domain, ensure SSL is configured

3. **Check Browser Console:**
   - Look for specific error codes
   - Verify error messages match the enhanced handling

## Next Steps

1. **Test the fixes** in your development environment
2. **Check browser console** for detailed error messages
3. **Run the verification script** to ensure database setup is correct
4. **If issues persist**, share the console logs for further diagnosis

## Additional Notes

- The fallback mechanism ensures addresses can be created even if the RPC function has issues
- The location data is stored as JSON in the fallback, which can be migrated to PostGIS geometry later
- All error messages are now in Spanish for better user experience
- The geolocation button now provides clear feedback about what went wrong
