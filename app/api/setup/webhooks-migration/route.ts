import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/setup/webhooks-migration - Add updated_at column to webhooks table
 */
export async function POST() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* do nothing */ },
        },
      }
    )

    // Add updated_at column if it doesn't exist
    const { error } = await supabase.rpc('sql', {
      query: `ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
    })

    if (error) {
      // Try direct SQL if RPC fails
      const { error: directError } = await supabase
        .from('webhooks')
        .select('id')
        .limit(1)

      if (directError && directError.message.includes('column "updated_at" does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Migration needed but cannot execute automatically',
          details: 'Please run: ALTER TABLE webhooks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhooks table migration completed successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error'
    }, { status: 500 })
  }
}