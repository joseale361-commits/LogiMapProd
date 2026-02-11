-- Fix route_stops status check constraint
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing check constraint
ALTER TABLE public.route_stops
DROP CONSTRAINT IF EXISTS route_stops_status_check;

-- Step 2: Create a new check constraint that allows all valid statuses
ALTER TABLE public.route_stops
ADD CONSTRAINT route_stops_status_check CHECK (
    status IN (
        'pending',
        'in_progress',
        'completed',
        'failed',
        'skipped',
        'delivered'
    )
);

SELECT 'route_stops status constraint fixed successfully!' as result;