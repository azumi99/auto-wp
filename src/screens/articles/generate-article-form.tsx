"use client"

import { useState, useEffect } from "react"
import { IconLoader2, IconRocket } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { generateArticle, getWebsites } from "@/src/lib/articles/actions"

interface GenerateArticleFormProps {
  onSuccess: () => void
}

export function GenerateArticleForm({ onSuccess }: GenerateArticleFormProps) {
  const [loading, setLoading] = useState(false)
  const [websites, setWebsites] = useState<any[]>([])
  const [formData, setFormData] = useState({
    website_id: "",
    topic: "",
    style: "informative",
    language: "en",
    tone: "professional",
    target_audience: "",
    include_image: true,
    auto_publish: false,
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

    if (!formData.topic || !formData.website_id) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      const result = await generateArticle(formData)
      toast.success(result.auto_publish
        ? "Article generated and published successfully!"
        : "Article generated successfully!")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Failed to generate article")
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
          disabled={loading}
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
        <Label htmlFor="topic">Topic / Title *</Label>
        <Input
          id="topic"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="e.g., The Future of AI in Healthcare"
          required
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="style">Style</Label>
          <Select
            value={formData.style}
            onValueChange={(value) => setFormData({ ...formData, style: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="seo">SEO Optimized</SelectItem>
              <SelectItem value="informative">Informative</SelectItem>
              <SelectItem value="storytelling">Storytelling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Select
            value={formData.tone}
            onValueChange={(value) => setFormData({ ...formData, tone: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="persuasive">Persuasive</SelectItem>
              <SelectItem value="authoritative">Authoritative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="id">Indonesian</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_audience">Target Audience</Label>
          <Input
            id="target_audience"
            value={formData.target_audience}
            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            placeholder="e.g., Healthcare professionals"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include_image"
            checked={formData.include_image}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, include_image: checked as boolean })
            }
            disabled={loading}
          />
          <Label htmlFor="include_image" className="cursor-pointer">
            Include featured image
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="auto_publish"
            checked={formData.auto_publish}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, auto_publish: checked as boolean })
            }
            disabled={loading}
          />
          <Label htmlFor="auto_publish" className="cursor-pointer">
            Auto-publish to WordPress
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <IconRocket className="mr-2 h-4 w-4" />
              Generate Article
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
