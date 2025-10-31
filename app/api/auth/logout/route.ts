import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Await cookies() in Next.js 15+
  const cookieStore = await cookies();

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Server Component error - can be ignored with middleware
          }
        },
      },
    }
  );

  try {
    // Sign out - this will automatically remove the auth cookies
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Supabase SSR automatically removes the session cookies
    // The auth-token cookie will be cleared by the signOut() method

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}