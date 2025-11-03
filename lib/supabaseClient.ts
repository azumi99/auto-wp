import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Store tokens in cookies
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  )
}


export async function uploadAvatar(file: File, userId: string) {
  const supabase = createClient();

  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatars.${fileExt}`;

  const { error: uploadError } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Helper function to remove avatar from Supabase storage
export async function removeAvatar(userId: string) {
  const supabase = createClient();

  // Delete avatar file from storage
  const fileName = `${userId}/avatar`;
  const { error } = await supabase.storage.from('avatars').remove([fileName]);

  if (error) throw error;
}