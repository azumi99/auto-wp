export interface Article {
  id: string
  websiteId: string
  userId: string
  title: string
  scheduledAt?: string
  status: 'draft' | 'published' | 'scheduled' | 'failed'
  webhookId?: string
  createdAt: string
  updatedAt: string
  generationType?: string
  generationProgress?: number
  generationMessage?: string
  errorMessage?: string
  failedAt?: string
  wpPostId?: number
  wordCount?: number
  generationTimeSeconds?: number
  publishedAt?: string
  wpPostUrl?: string
}

export interface Website {
  id: string
  name: string
  url: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  metadata?: any
}

export interface ArticleGenerationForm {
  websiteId: string
  title: string
  tone: string
  length: number
  keywords?: string[]
  includeSeo: boolean
  scheduledPublish?: boolean
  scheduledDate?: Date
  publishTime?: string
}