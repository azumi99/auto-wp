"use client"

import { useState, useEffect } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createArticle, updateArticle, getWebsites } from "@/src/lib/articles/actions"
import type { Article, ArticleFormData } from "@/src/lib/articles/types"

interface ArticleFormProps {
  article?: Article | null
  onSuccess: () => void
}

export function ArticleForm({ article, onSuccess }: ArticleFormProps) {
  const [loading, setLoading] = useState(false)
  const [websites, setWebsites] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: article?.title || "",
    content: article?.content || "",
    excerpt: article?.excerpt || "",
    website_id: article?.website_id || "",
    status: article?.status || "draft",
    category: article?.category || "",
    tags: article?.tags?.join(", ") || "",
  })

  useEffect(() => {
    loadWebsites()
  }, [])

  const loadWebsites = async () => {
    try {
      const data = await getWebsites()
      setWebsites(data)
      if (data.length > 0 && !formData.website_id) {
        setFormData(prev => ({ ...prev, website_id: data[0].id }))
      }
    } catch (error: any) {
      toast.error("Failed to load websites")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.content || !formData.website_id) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      const tagsArray = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      if (article) {
        await updateArticle(article.id, { ...formData, tags: tagsArray })
        toast.success("Article updated successfully")
      } else {
        await createArticle({ ...formData, tags: tagsArray })
        toast.success("Article created successfully")
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Failed to save article")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="website_id">Website *</Label>
        <Select
          value={formData.website_id}
          onValueChange={(value) => setFormData({ ...formData, website_id: value })}
          disabled={loading || !!article}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select website" />
          </SelectTrigger>
          <SelectContent>
            {websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>
                {website.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Article title"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Brief summary of the article"
          rows={2}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Article content (supports HTML)"
          rows={10}
          required
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Technology"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as ArticleFormData["status"] })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="Separate with commas: AI, Technology, Innovation"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          {article ? "Update Article" : "Create Article"}
        </Button>
      </div>
    </form>
  )
}
