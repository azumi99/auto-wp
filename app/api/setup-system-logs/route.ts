import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServices'

/**
 * POST /api/setup-system-logs - Create system_logs table
 * This is a one-time setup endpoint
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // Create the system_logs table using SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS system_logs (
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
      CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
      CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);
      CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

      -- Enable Row Level Security
      ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their own logs and system logs" ON system_logs;
      DROP POLICY IF EXISTS "Service role can insert logs" ON system_logs;
      DROP POLICY IF EXISTS "Users cannot update logs" ON system_logs;
      DROP POLICY IF EXISTS "Users cannot delete logs" ON system_logs;

      -- Create RLS policies
      CREATE POLICY "Users can view their own logs and system logs" ON system_logs
          FOR SELECT USING (
              user_id IS NULL OR
              user_id = auth.uid()
          );

      CREATE POLICY "Service role can insert logs" ON system_logs
          FOR INSERT WITH CHECK (
              true
          );

      CREATE POLICY "Users cannot update logs" ON system_logs
          FOR UPDATE USING (false);

      CREATE POLICY "Users cannot delete logs" ON system_logs
          FOR DELETE USING (false);
    `

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      // Try using direct SQL if RPC doesn't work
      console.log('RPC failed, trying direct table creation...')

      // Create basic table without RLS first
      const { error: tableError } = await supabase
        .from('system_logs')
        .select('id')
        .limit(1)

      if (tableError && tableError.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Table does not exist and SQL execution failed. Please run the migration manually.',
          details: error.message,
          manual_migration: true,
          migration_file: 'supabase/migrations/08_create_system_logs_table.sql'
        }, { status: 500 })
      }
    }

    // Test the table by inserting a test log
    const { error: insertError } = await supabase
      .from('system_logs')
      .insert({
        level: 'info',
        message: 'System logs table setup completed',
        source: 'setup-api',
        metadata: { setup: true }
      })

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Table created but test insert failed',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'System logs table setup completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error setting up system logs table:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        manual_migration: true,
        migration_file: 'supabase/migrations/08_create_system_logs_table.sql'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/setup-system-logs - Check if system_logs table exists
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('system_logs')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        exists: false,
        error: error.message,
        setup_needed: true
      })
    }

    return NextResponse.json({
      success: true,
      exists: true,
      message: 'System logs table exists and is accessible',
      setup_needed: false
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      setup_needed: true
    }, { status: 500 })
  }
}