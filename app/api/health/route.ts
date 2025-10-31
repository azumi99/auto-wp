import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServices'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: {
      status: 'healthy' | 'unhealthy'
      message: string
    }
    webhooks: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      message: string
    }
    ai: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      message: string
    }
  }
}



async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
}> {
  try {
    const supabase = await createClient()

    // Test database connection with a simple query
    const { error } = await supabase
      .from('websites')
      .select('id')
      .limit(1)

    if (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`
      }
    }

    return {
      status: 'healthy',
      message: 'Database connection is healthy'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkWebhookHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}> {
  try {
    // Check if we have any webhook configurations
    const supabase = await createClient()
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('id, url')
      .limit(5)

    if (error) {
      return {
        status: 'unhealthy',
        message: `Webhook check failed: ${error.message}`
      }
    }

    if (!webhooks || webhooks.length === 0) {
      return {
        status: 'healthy',
        message: 'No webhooks configured'
      }
    }

    // For demo purposes, assume webhooks are working
    // In production, you could actually test webhook endpoints
    return {
      status: 'degraded',
      message: 'Webhooks configured but not actively tested'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkAIHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}> {
  try {
    // Check if AI prompts are configured
    const supabase = await createClient()
    const { data: prompts, error } = await supabase
      .from('ai_prompts')
      .select('id')
      .limit(1)

    if (error) {
      return {
        status: 'unhealthy',
        message: `AI service check failed: ${error.message}`
      }
    }

    if (!prompts || prompts.length === 0) {
      return {
        status: 'degraded',
        message: 'No AI prompts configured'
      }
    }

    return {
      status: 'healthy',
      message: 'AI service is ready'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * GET /api/health - System health check
 */
export async function GET() {
  try {
    const [database, webhooks, ai] = await Promise.all([
      checkDatabaseHealth(),
      checkWebhookHealth(),
      checkAIHealth()
    ])

    // Determine overall health status
    const services = [database, webhooks, ai]
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const healthCheck: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database,
        webhooks,
        ai
      }
    }

    return NextResponse.json({
      success: true,
      data: healthCheck
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      },
      { status: 500 }
    )
  }
}