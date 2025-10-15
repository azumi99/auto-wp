"use server"

import { createClient } from "@/lib/supabaseServices"
import { revalidatePath } from "next/cache"
import type { ArticleFormData, GenerateArticleData } from "./types"

export async function getArticles() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      websites:website_id (
        id,
        name,
        url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getArticle(id: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      websites:website_id (
        id,
        name,
        url
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createArticle(formData: ArticleFormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const slug = formData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const wordCount = formData.content
    ? formData.content.split(/\s+/).filter(word => word.length > 0).length
    : 0

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: formData.title,
      slug,
      content: formData.content,
      excerpt: formData.excerpt || null,
      website_id: formData.website_id,
      status: formData.status,
      category: formData.category || null,
      tags: formData.tags || [],
      author_id: user.id,
      word_count: wordCount,
    })
    .select()
    .single()

  if (error) throw error

  await logActivity({
    userId: user.id,
    action: "article_created",
    entityType: "article",
    entityId: data.id,
    metadata: { title: formData.title },
  })

  revalidatePath("/articles")
  return data
}

export async function updateArticle(id: string, formData: Partial<ArticleFormData>) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const updateData: any = {}

  if (formData.title) {
    updateData.title = formData.title
    updateData.slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  if (formData.content !== undefined) {
    updateData.content = formData.content
    updateData.word_count = formData.content
      ? formData.content.split(/\s+/).filter(word => word.length > 0).length
      : 0
  }

  if (formData.excerpt !== undefined) updateData.excerpt = formData.excerpt || null
  if (formData.status) updateData.status = formData.status
  if (formData.category !== undefined) updateData.category = formData.category || null
  if (formData.tags !== undefined) updateData.tags = formData.tags || []

  const { data, error } = await supabase
    .from("articles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  await logActivity({
    userId: user.id,
    action: "article_updated",
    entityType: "article",
    entityId: id,
    metadata: { title: formData.title },
  })

  revalidatePath("/articles")
  return data
}

export async function deleteArticle(id: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const article = await getArticle(id)

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id)

  if (error) throw error

  await logActivity({
    userId: user.id,
    action: "article_deleted",
    entityType: "article",
    entityId: id,
    metadata: { title: article.title },
  })

  revalidatePath("/articles")
}

export async function generateArticle(data: GenerateArticleData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const startTime = Date.now()

  const prompt = `Write a ${data.style} article about "${data.topic}" in ${data.language} language with a ${data.tone} tone.${
    data.target_audience ? ` Target audience: ${data.target_audience}.` : ""
  }

  Requirements:
  - Write a comprehensive, well-structured article
  - Include an engaging introduction
  - Use clear headings and subheadings
  - Provide valuable insights and information
  - End with a strong conclusion
  - Aim for 800-1200 words

  Format the output as JSON with these fields:
  {
    "title": "Article title",
    "excerpt": "Brief 2-3 sentence summary",
    "content": "Full article content with HTML formatting"
  }`

  const generatedContent = {
    title: `${data.topic} - AI Generated Article`,
    excerpt: `This is an AI-generated article about ${data.topic} with a ${data.tone} tone and ${data.style} style.`,
    content: `<h1>${data.topic}</h1>

    <p>This is a demonstration article generated about ${data.topic}. In a production environment, this would connect to an AI service like OpenAI, Anthropic Claude, or Google Gemini to generate actual content.</p>

    <h2>Key Points</h2>
    <ul>
      <li>Topic: ${data.topic}</li>
      <li>Style: ${data.style}</li>
      <li>Tone: ${data.tone}</li>
      <li>Language: ${data.language}</li>
      ${data.target_audience ? `<li>Target Audience: ${data.target_audience}</li>` : ""}
    </ul>

    <h2>Implementation Note</h2>
    <p>To enable actual AI content generation, you would integrate with services like:</p>
    <ul>
      <li>OpenAI GPT-4</li>
      <li>Anthropic Claude</li>
      <li>Google Gemini</li>
      <li>Or use n8n workflow with AI nodes</li>
    </ul>

    <p>The system would send a request to your configured AI service, receive the generated content, and automatically save it to the database with all metadata.</p>`
  }

  const generationTime = Math.floor((Date.now() - startTime) / 1000)
  const wordCount = generatedContent.content.split(/\s+/).filter(w => w.length > 0).length

  const slug = generatedContent.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const articleData: any = {
    title: generatedContent.title,
    slug,
    content: generatedContent.content,
    excerpt: generatedContent.excerpt,
    website_id: data.website_id,
    status: data.auto_publish ? "published" : "draft",
    author_id: user.id,
    ai_model: "demo-ai-model",
    generation_time_seconds: generationTime,
    word_count: wordCount,
    metadata: {
      generation_params: {
        style: data.style,
        tone: data.tone,
        language: data.language,
        target_audience: data.target_audience,
      },
    },
  }

  if (data.auto_publish) {
    articleData.published_at = new Date().toISOString()
  }

  const { data: article, error } = await supabase
    .from("articles")
    .insert(articleData)
    .select()
    .single()

  if (error) throw error

  await logActivity({
    userId: user.id,
    action: "article_generated",
    entityType: "article",
    entityId: article.id,
    metadata: {
      title: article.title,
      ai_model: "demo-ai-model",
      auto_publish: data.auto_publish,
    },
  })

  revalidatePath("/articles")
  return article
}

export async function getWebsites() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("websites")
    .select("id, name, url, status")
    .eq("status", "active")
    .order("name")

  if (error) throw error
  return data || []
}

async function logActivity(params: {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, any>
}) {
  const supabase = createClient()

  await supabase.from("user_activity_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    metadata: params.metadata || {},
  })
}
