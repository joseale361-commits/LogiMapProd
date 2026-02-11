-- Migration to add generated location columns for mapping
-- These columns simplify coordinate access for the frontend

-- Add generated columns to distributors (warehouse location)
ALTER TABLE distributors 
ADD COLUMN IF NOT EXISTS warehouse_lat DOUBLE PRECISION GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
ADD COLUMN IF NOT EXISTS warehouse_lng DOUBLE PRECISION GENERATED ALWAYS AS (ST_X(location::geometry)) STORED;

-- Add generated columns to orders (delivery location)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION GENERATED ALWAYS AS (ST_Y(delivery_location::geometry)) STORED,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION GENERATED ALWAYS AS (ST_X(delivery_location::geometry)) STORED;