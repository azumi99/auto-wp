import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/force-process - Force process scheduled articles (for testing)
 */
export async function POST(request: Request) {
  try {
    const { articleId } = await request.json()

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

    // Get specific article with workflow data including website credentials
    let article
    if (articleId) {
      const { data } = await supabase
        .from('articles')
        .select(`
          id, title, user_id, website_id, webhook_id, scheduled_at,
          status, generation_type,
          websites(name, url, wp_username, wp_password),
          webhooks(name, url),
          workflows(
            id,
            name,
            settings
          )
        `)
        .eq('id', articleId)
        .single()

      article = data
    } else {
      // Find the most recent scheduled article with workflow data
      const { data } = await supabase
        .from('articles')
        .select(`
          id, title, user_id, website_id, webhook_id, scheduled_at,
          status, generation_type,
          websites(name, url, wp_username, wp_password),
          webhooks(name, url),
          workflows(
            id,
            name,
            settings
          )
        `)
        .in('status', ['pending', 'scheduled'])
        .in('generation_type', ['scheduled', 'manual'])
        .not('webhook_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      article = data
    }

    if (!article) {
      return NextResponse.json({
        success: false,
        error: 'No suitable article found to process'
      }, { status: 404 })
    }

    console.log(`🚀 [FORCE] Processing article: ${article.title} (ID: ${article.id})`)

    // Get webhook details
    if (!article.webhook_id) {
      return NextResponse.json({
        success: false,
        error: 'Article has no webhook_id'
      }, { status: 400 })
    }

    const { data: webhookData } = await supabase
      .from('webhooks')
      .select('id, name, url')
      .eq('id', article.webhook_id)
      .single()

    if (!webhookData) {
      return NextResponse.json({
        success: false,
        error: `Webhook ${article.webhook_id} not found`
      }, { status: 404 })
    }

    console.log(`🔗 [FORCE] Using webhook: ${webhookData.name} (${webhookData.url})`)

    // Update article status to processing
    await supabase
      .from('articles')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', article.id)

    // Prepare webhook payload with new format including website credentials
    const payload = {
      body: {
        topic: article.title,
        website_id: article.website_id,
        article_id: article.id,
        trigger_type: 'manual_force_process',
        user_id: article.user_id,
        scheduled_at: article.scheduled_at || new Date().toISOString(),
        metadata: {
          website_name: article.websites?.name || '',
          website_url: article.websites?.url || '',
          website_username: article.websites?.wp_username || '',
          website_password: article.websites?.wp_password || '',
          webhook_name: webhookData.name,
          webhook_id: webhookData.id,
          generation_type: article.generation_type,
          processed_at: new Date().toISOString(),
          forced: true
        }
      }
    }

    console.log(`📦 [FORCE] Payload:`, JSON.stringify(payload, null, 2))

    // Trigger webhook
    const webhookResponse = await fetch(webhookData.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WP-Auto-Force-Processor/1.0'
      },
      body: JSON.stringify(payload)
    })

    console.log(`📬 [FORCE] Webhook response status: ${webhookResponse.status}`)

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error(`❌ [FORCE] Webhook failed: ${errorText}`)

      // Update article status to failed
      await supabase
        .from('articles')
        .update({ status: 'failed' })
        .eq('id', article.id)

      return NextResponse.json({
        success: false,
        error: `Webhook failed with status ${webhookResponse.status}: ${errorText}`
      }, { status: 500 })
    }

    const responseText = await webhookResponse.text()
    console.log(`✅ [FORCE] Webhook success: ${responseText}`)

    // Update article status to posted
    await supabase
      .from('articles')
      .update({
        status: 'posted',
        updated_at: new Date().toISOString()
      })
      .eq('id', article.id)

    return NextResponse.json({
      success: true,
      message: 'Article processed successfully',
      data: {
        article: {
          id: article.id,
          title: article.title,
          status: 'posted'
        },
        webhook: {
          id: webhookData.id,
          name: webhookData.name,
          url: webhookData.url
        },
        webhook_response: {
          status: webhookResponse.status,
          body: responseText
        }
      }
    })

  } catch (error) {
    console.error('Error in force process:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}