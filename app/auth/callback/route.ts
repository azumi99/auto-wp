import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const invitationToken = searchParams.get('invitation_token') // Check for invitation token in callback

  if (code) {
    const cookieStore = cookies()
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/login?error=auth-code-error', request.url))
    }

    // Check if email is confirmed
    if (data.user && !data.user.email_confirmed_at) {
      // Email not confirmed - redirect with error
      return NextResponse.redirect(new URL('/login?error=email-not-confirmed', request.url))
    }

    // If this is an invitation flow and we have an invitation token
    if (invitationToken && data.user) {
      // Process the invitation here
      console.log("Processing invitation for user:", data.user.id, "with token:", invitationToken);
      
      // This is where you would handle the invitation logic:
      // 1. Validate the invitation token
      // 2. Add the user to the appropriate company/project
      // 3. Update the invitation as used
      
      // For now, we'll just log this - you'll need to implement the logic based on your requirements
    }

    // For email confirmation flow, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}