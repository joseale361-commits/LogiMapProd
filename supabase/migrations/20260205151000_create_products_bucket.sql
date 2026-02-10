-- Create the bucket
INSERT INTO
    storage.buckets (id, name, public)
VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for public access (viewing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON storage.objects
        FOR SELECT USING (bucket_id = 'products');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Admin All Access'
    ) THEN
        CREATE POLICY "Admin All Access" ON storage.objects
        FOR ALL TO service_role USING (bucket_id = 'products') WITH CHECK (bucket_id = 'products');
    END IF;
END $$;