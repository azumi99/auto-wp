-- Migration: Add storage policies for avatars bucket
-- This migration adds necessary policies to allow users to upload and access their own avatars
-- NOTE: The 'avatars' bucket must be created in the Supabase dashboard first before running this migration

-- Create policies for avatars bucket to allow authenticated users to upload and read their own avatars
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, false, 5242880, '{image/png,image/jpg,image/jpeg,image/webp,image/gif}') 
ON CONFLICT (id) DO UPDATE SET 
  public = excluded.public,
  avif_autodetection = excluded.avif_autodetection,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Create storage policies for avatars bucket
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public access policy (if needed for displaying avatars on the website)
CREATE POLICY "Public access to avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');