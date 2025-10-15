export interface Article {
  id: string
  website_id: string
  title: string
  slug: string | null
  content: string | null
  excerpt: string | null
  featured_image_url: string | null
  wp_post_id: number | null
  wp_post_url: string | null
  status: "draft" | "scheduled" | "published" | "failed" | "archived"
  author_id: string | null
  ai_model: string | null
  generation_time_seconds: number | null
  word_count: number | null
  category: string | null
  tags: string[] | null
  scheduled_at: string | null
  published_at: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ArticleFormData {
  title: string
  content: string
  excerpt?: string
  website_id: string
  status: "draft" | "scheduled" | "published" | "failed" | "archived"
  category?: string
  tags?: string[]
}

export interface GenerateArticleData {
  website_id: string
  topic: string
  style: string
  language: string
  tone: string
  target_audience?: string
  include_image: boolean
  auto_publish: boolean
}
