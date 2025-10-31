import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServices'
import { executeRealtimeAction } from '@/lib/realtime/actions'

interface SystemLog {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
  user_id?: string
  metadata?: Record<string, any>
  created_at: string
  details?: {
    method?: string
    url?: string
    ip?: string
    user_agent?: string
    article_id?: string
    webhook_id?: string
    status?: string
  }
}

/**
 * GET /api/system-logs - Get system logs with filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const timeRange = searchParams.get('timeRange') || '24h'

    const supabase = await createClient()

    // Calculate time filter
    let timeFilter = new Date()
    switch (timeRange) {
      case '1h':
        timeFilter.setHours(timeFilter.getHours() - 1)
        break
      case '6h':
        timeFilter.setHours(timeFilter.getHours() - 6)
        break
      case '24h':
        timeFilter.setDate(timeFilter.getDate() - 1)
        break
      case '7d':
        timeFilter.setDate(timeFilter.getDate() - 7)
        break
      case '30d':
        timeFilter.setDate(timeFilter.getDate() - 30)
        break
    }

    // Build query
    let query = supabase
      .from('system_logs')
      .select('*')
      .gte('created_at', timeFilter.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    // Apply filters
    if (level && level !== 'all') {
      query = query.eq('level', level)
    }
    if (source && source !== 'all') {
      query = query.eq('source', source)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching system logs:', error)

      // Check if table doesn't exist
      if (error.message?.includes('does not exist') || error.message?.includes('Could not find the table')) {
        return NextResponse.json(
          {
            success: false,
            error: 'System logs table not found. Please run the migration file 08_create_system_logs_table.sql',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('system_logs')
      .select('level, source')
      .gte('created_at', timeFilter.toISOString())

    const statistics = {
      total: logs?.length || 0,
      byLevel: stats?.reduce((acc: any, log: any) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
      }, {}) || {},
      bySource: stats?.reduce((acc: any, log: any) => {
        acc[log.source] = (acc[log.source] || 0) + 1
        return acc
      }, {}) || {}
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        statistics,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (count || 0)
        },
        timeRange,
        filters: { level, source }
      }
    })

  } catch (error) {
    console.error('Error in system logs API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/system-logs - Create a new system log entry
 */
export async function POST(request: Request) {
  return executeRealtimeAction(async () => {
    const body = await request.json()
    const { level, message, source, metadata, details } = body

    if (!level || !message || !source) {
      throw new Error('Missing required fields: level, message, source')
    }

    const supabase = await createClient()

    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser()

    const logEntry = {
      id: crypto.randomUUID(),
      level,
      message,
      source,
      user_id: user?.id,
      metadata: metadata || {},
      details: details || {},
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('system_logs')
      .insert(logEntry)
      .select()
      .single()

    if (error) {
      console.error('Error creating system log:', error)
      throw new Error(`Failed to create system log: ${error.message}`)
    }

    return {
      success: true,
      data
    }
  }, {
    tableName: 'system_logs',
    userId: '',
    revalidatePaths: ['/dashboard/logs', '/api/system-logs']
  })
}