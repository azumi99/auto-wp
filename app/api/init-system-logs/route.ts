import { NextResponse } from 'next/server'

/**
 * POST /api/init-system-logs - Initialize system logs with a simple approach
 */
export async function POST() {
  try {
    const simpleSQL = `
-- Create system_logs table with basic setup
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    user_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple index
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);

-- Insert test log
INSERT INTO public.system_logs (level, message, source, metadata)
VALUES ('info', 'System logs table initialized successfully', 'setup', '{"auto": true}')
ON CONFLICT DO NOTHING;
    `

    return NextResponse.json({
      success: true,
      message: 'Use this SQL to set up system logs table',
      sql: simpleSQL,
      next_steps: [
        '1. Go to Supabase Dashboard',
        '2. Navigate to SQL Editor',
        '3. Copy and paste the SQL above',
        '4. Execute the SQL',
        '5. Test by visiting /api/system-logs'
      ],
      note: 'The system will fall back to test logs until the database table is created.'
    })

  } catch (error) {
    console.error('Error generating setup SQL:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}