import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabaseServices'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    const supabase = await createClient()

    // Attempt to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Registration API error:', error)
      return Response.json({ 
        error: error.message || 'Registration failed', 
        code: error.code,
        status: error.status
      }, { 
        status: error.status || 500 
      })
    }

    return Response.json({ 
      success: true, 
      data 
    })
  } catch (error: any) {
    console.error('Unexpected registration API error:', error)
    return Response.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { 
      status: 500 
    })
  }
}