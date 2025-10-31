import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/create-system-logs-table - Create system_logs table using service role
 */
export async function POST() {
  try {
    // Use service role client for admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* do nothing */ }
        }
      }
    )

    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('system_logs')
      .select('id')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'System logs table already exists',
        already_exists: true
      })
    }

    // Create the table using raw SQL (this might not work without proper SQL execution)
    // For now, let's return instructions for manual setup
    return NextResponse.json({
      success: false,
      error: 'Manual setup required',
      instructions: {
        step1: 'Go to your Supabase dashboard',
        step2: 'Navigate to SQL Editor',
        step3: 'Run the following SQL query:',
        sql: `
-- Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON public.system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- Enable Row Level Security
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own logs and system logs" ON public.system_logs
    FOR SELECT USING (
        user_id IS NULL OR
        user_id = auth.uid()
    );

CREATE POLICY "Service role can insert logs" ON public.system_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users cannot update logs" ON public.system_logs
    FOR UPDATE USING (false);

CREATE POLICY "Users cannot delete logs" ON public.system_logs
    FOR DELETE USING (false);

-- Grant permissions
GRANT SELECT, INSERT ON public.system_logs TO authenticated;
GRANT SELECT, INSERT ON public.system_logs TO service_role;
GRANT USAGE ON public.system_logs TO authenticated;
GRANT USAGE ON public.system_logs TO service_role;
        `,
        step4: 'After running the SQL, the system logs will work',
        step5: 'Test by visiting /api/system-logs'
      }
    })

  } catch (error) {
    console.error('Error in create table API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        instructions: 'Please run the migration manually: supabase/migrations/08_create_system_logs_table.sql'
      },
      { status: 500 }
    )
  }
}