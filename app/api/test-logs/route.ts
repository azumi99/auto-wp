import { NextResponse } from 'next/server'

interface TestLog {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
  created_at: string
  metadata?: Record<string, any>
}

// In-memory logs for testing (will reset on server restart)
let testLogs: TestLog[] = [
  {
    id: '1',
    level: 'info',
    message: 'System initialized successfully',
    source: 'system',
    created_at: new Date().toISOString(),
    metadata: { version: '1.0.0' }
  },
  {
    id: '2',
    level: 'warn',
    message: 'High memory usage detected',
    source: 'monitor',
    created_at: new Date(Date.now() - 60000).toISOString(),
    metadata: { memory_usage: '85%' }
  },
  {
    id: '3',
    level: 'error',
    message: 'Failed to connect to webhook',
    source: 'webhook',
    created_at: new Date(Date.now() - 120000).toISOString(),
    metadata: { webhook_url: 'https://example.com/webhook' }
  },
  {
    id: '4',
    level: 'info',
    message: 'Article processed successfully',
    source: 'scheduler',
    created_at: new Date(Date.now() - 180000).toISOString(),
    metadata: { article_id: 'abc123' }
  },
  {
    id: '5',
    level: 'debug',
    message: 'Database query executed',
    source: 'database',
    created_at: new Date(Date.now() - 240000).toISOString(),
    metadata: { query: 'SELECT * FROM articles' }
  }
]

/**
 * GET /api/test-logs - Get test logs (for testing when DB is not available)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')

    let filteredLogs = [...testLogs]

    // Apply filters
    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    if (source && source !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.source === source)
    }

    // Apply limit
    filteredLogs = filteredLogs.slice(0, limit)

    // Calculate statistics
    const statistics = {
      total: testLogs.length,
      byLevel: testLogs.reduce((acc: any, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
      }, {}),
      bySource: testLogs.reduce((acc: any, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: filteredLogs,
        statistics,
        pagination: {
          total: filteredLogs.length,
          limit,
          offset: 0,
          hasMore: false
        },
        timeRange: '24h',
        filters: { level, source },
        note: 'Using in-memory test logs. Set up database table for persistent logging.'
      }
    })

  } catch (error) {
    console.error('Error in test logs API:', error)
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
 * POST /api/test-logs - Add a new test log
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { level, message, source, metadata } = body

    if (!level || !message || !source) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: level, message, source'
        },
        { status: 400 }
      )
    }

    const newLog: TestLog = {
      id: crypto.randomUUID(),
      level,
      message,
      source,
      created_at: new Date().toISOString(),
      metadata: metadata || {}
    }

    testLogs.unshift(newLog) // Add to beginning

    return NextResponse.json({
      success: true,
      data: newLog
    })

  } catch (error) {
    console.error('Error creating test log:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}