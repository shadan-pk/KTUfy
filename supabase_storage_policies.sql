-- ============================================
-- Supabase Storage Policies for 'notes' Bucket
-- ============================================
-- Run this script in Supabase Dashboard > SQL Editor
-- to set up storage access policies

-- ============================================
-- 1. PUBLIC READ ACCESS (Anyone can download)
-- ============================================
CREATE POLICY "Public can view/download notes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'notes');

-- ============================================
-- 2. AUTHENTICATED UPLOAD ACCESS
-- ============================================
CREATE POLICY "Authenticated users can upload notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notes' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 3. UPDATE OWN FILES
-- ============================================
CREATE POLICY "Users can update their own notes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'notes' 
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'notes'
  AND auth.uid() = owner
);

-- ============================================
-- 4. DELETE OWN FILES
-- ============================================
CREATE POLICY "Users can delete their own notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'notes'
  AND auth.uid() = owner
);

-- ============================================
-- OPTIONAL: Admin Override (if you have admin role)
-- ============================================
-- Uncomment if you want admins to manage all files

-- CREATE POLICY "Admins can do anything"
-- ON storage.objects FOR ALL
-- TO authenticated
-- USING (
--   bucket_id = 'notes'
--   AND (
--     SELECT EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE id = auth.uid()
--       AND raw_user_meta_data->>'role' = 'admin'
--     )
--   )
-- )
-- WITH CHECK (
--   bucket_id = 'notes'
--   AND (
--     SELECT EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE id = auth.uid()
--       AND raw_user_meta_data->>'role' = 'admin'
--     )
--   )
-- );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check if policies are created
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%notes%';

-- Check bucket configuration
-- SELECT * FROM storage.buckets WHERE id = 'notes';
