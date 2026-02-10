-- Create sample categories for logimap-demo distributor
-- Run this in Supabase SQL editor

-- First, get the distributor ID
-- SELECT id FROM distributors WHERE slug = 'logimap-demo';
-- Expected: 38d49ff8-c266-4e2a-a4cf-380059832bab

-- Insert sample categories
INSERT INTO
    categories (
        distributor_id,
        name,
        slug,
        description,
        is_active
    )
VALUES (
        '38d49ff8-c266-4e2a-a4cf-380059832bab',
        'Bebidas',
        'bebidas',
        'Bebidas y refrescos',
        true
    ),
    (
        '38d49ff8-c266-4e2a-a4cf-380059832bab',
        'Snacks',
        'snacks',
        'Snacks y botanas',
        true
    ),
    (
        '38d49ff8-c266-4e2a-a4cf-380059832bab',
        'Lácteos',
        'lacteos',
        'Productos lácteos',
        true
    ),
    (
        '38d49ff8-c266-4e2a-a4cf-380059832bab',
        'Panadería',
        'panaderia',
        'Pan y productos de panadería',
        true
    ),
    (
        '38d49ff8-c266-4e2a-a4cf-380059832bab',
        'Abarrotes',
        'abarrotes',
        'Productos de abarrotes',
        true
    ) ON CONFLICT DO NOTHING;