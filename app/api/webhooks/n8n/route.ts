import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateArticleProgress } from '@/src/lib/articles/scheduled-articles'

interface N8NWebhookPayload {
  article_id: string
  status: 'started' | 'progress' | 'completed' | 'failed'
  progress?: number
  message?: string
  error?: string
  result?: any
}

/**
 * POST /api/webhooks/n8n - Webhook endpoint for n8n workflows
 * This endpoint receives updates from n8n about article generation progress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { article_id, status, progress, message, error, result }: N8NWebhookPayload = body

    console.log(`🔔 Received n8n webhook for article ${article_id}:`, { status, progress, message })

    // Validate required fields
    if (!article_id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: article_id, status'
        },
        { status: 400 }
      )
    }

    // Create service role client for database updates
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

    // Map n8n status to our article status
    let articleStatus: string
    switch (status) {
      case 'started':
        articleStatus = 'processing'
        break
      case 'progress':
        articleStatus = 'processing'
        break
      case 'completed':
        articleStatus = 'posted'
        break
      case 'failed':
        articleStatus = 'failed'
        break
      default:
        articleStatus = 'processing'
    }

    // Prepare update data
    const updateData: any = {
      status: articleStatus,
      updated_at: new Date().toISOString()
    }

    // Add progress tracking if provided
    if (progress !== undefined) {
      updateData.generation_progress = progress
    }

    // Add status message if provided
    if (message) {
      updateData.generation_message = message
    }

    // Add error information if failed
    if (error && status === 'failed') {
      updateData.error_message = error
      updateData.failed_at = new Date().toISOString()
    }

    // Add result data if completed
    if (result && status === 'completed') {
      updateData.published_at = new Date().toISOString()
      if (result.post_url) {
        updateData.wp_post_url = result.post_url
      }
      if (result.post_id) {
        updateData.wp_post_id = result.post_id
      }
      if (result.word_count) {
        updateData.word_count = result.word_count
      }
      if (result.generation_time) {
        updateData.generation_time_seconds = result.generation_time
      }
    }

    // Update article in database
    const { data: updatedArticle, error: updateError } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', article_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating article from webhook:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update article',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully updated article ${article_id} status to ${articleStatus}`)

    // Log the webhook call for debugging
    await supabase
      .from('execution_logs')
      .insert({
        article_id: article_id,
        status: status === 'failed' ? 'failed' : 'success',
        trigger_type: 'webhook',
        metadata: {
          webhook_source: 'n8n',
          n8n_status: status,
          progress,
          message,
          error,
          result,
          updated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: `Article ${article_id} updated successfully`,
      data: {
        article_id,
        status: articleStatus,
        progress,
        message
      }
    })

  } catch (error) {
    console.error('❌ Error processing n8n webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/n8n - Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'n8n webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}