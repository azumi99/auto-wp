"use client"

import { useState, useEffect } from "react"
import { IconLoader2, IconRocket, IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getWebsitesClient } from "@/src/lib/websites/client-actions"
import { getWebhooksClient } from "@/src/lib/webhooks/client-actions"
import { generateArticleClient } from "@/src/lib/articles/client-actions"
import { Website } from "@/src/lib/websites/types"
import { Webhook } from "@/src/lib/webhooks/client-actions"

interface GenerateArticleFormProps {
  onSuccess: () => void
  generationType?: 'manual' | 'scheduled'
}

interface GenerateArticleFormData {
  website_id: string;
  webhook_id: string;
  topic: string;
  scheduled_datetime: string | null;
  generation_type: 'manual' | 'scheduled';
}

export function GenerateArticleForm({ onSuccess, generationType = 'manual' }: GenerateArticleFormProps) {
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [websites, setWebsites] = useState<Website[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])

  const [formData, setFormData] = useState<GenerateArticleFormData>({
    website_id: "",
    webhook_id: "",
    topic: "",
    scheduled_datetime: null,
    generation_type: generationType,
  })

  useEffect(() => {
    setFormData(prev => ({ ...prev, generation_type: generationType }))
  }, [generationType])

  useEffect(() => {
    loadWebsitesAndWebhooks()
  }, [])

  const loadWebsitesAndWebhooks = async () => {
    try {
      setDataLoading(true)
      console.log('Starting to load websites and webhooks...')

      const [websitesData, webhooksData] = await Promise.all([
        getWebsitesClient().catch(err => {
          console.error('Error fetching websites:', err)
          return []
        }),
        getWebhooksClient().catch(err => {
          console.error('Error fetching webhooks:', err)
          return []
        })
      ])

      console.log('Websites loaded:', websitesData)
      console.log('Webhooks loaded:', webhooksData)

      setWebsites(websitesData)
      setWebhooks(webhooksData)

      if (websitesData.length > 0 && !formData.website_id) {
        console.log('Setting default website:', websitesData[0].id)
        setFormData((prev: GenerateArticleFormData) => ({ ...prev, website_id: websitesData[0].id }))
      }

      if (webhooksData.length > 0 && !formData.webhook_id) {
        console.log('Setting default webhook:', webhooksData[0].id)
        setFormData((prev: GenerateArticleFormData) => ({ ...prev, webhook_id: webhooksData[0].id }))
      }
    } catch (error: any) {
      console.error('Error in loadWebsitesAndWebhooks:', error)
      toast.error("Failed to load websites or webhooks")
    } finally {
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enhanced validation
    const errors: string[] = []

    if (!formData.topic.trim()) {
      errors.push("Please fill in the topic field")
    } else if (formData.topic.trim().length < 3) {
      errors.push("Topic must be at least 3 characters long")
    }

    if (!formData.website_id || formData.website_id === "no-websites") {
      errors.push("Please create a website first before generating articles")
    }

    if (!formData.webhook_id || formData.webhook_id === "no-webhooks") {
      errors.push("Please create a webhook first before generating articles")
    }

    if (generationType === 'scheduled' && !formData.scheduled_datetime) {
      errors.push("Please select a schedule date and time")
    }

    if (errors.length > 0) {
      toast.error(errors[0]) // Show first error for cleaner UX
      return
    }

    try {
      setLoading(true)
      await generateArticleClient({
        ...formData,
        topic: formData.topic.trim(),
        webhook_id: formData.webhook_id // Use the selected webhook
      })
      // Success toast is handled in the client action
      onSuccess()
    } catch (error: any) {
      console.error('Generation error:', error)
      const errorMessage = error?.message || error?.error || error?.response?.data?.message || "Failed to generate article. Please try again."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="website_id">Website *</Label>
          <Select
            value={formData.website_id}
            onValueChange={(value) => setFormData({ ...formData, website_id: value })}
            disabled={loading || dataLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select website" />
            </SelectTrigger>
            <SelectContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-2">
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading websites...</span>
                </div>
              ) : websites.length > 0 ? (
                websites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))
              ) : (
                <div className="flex items-center justify-center py-2">
                  <span className="text-sm text-muted-foreground">No websites available</span>
                </div>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select the website where the article will be published
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook_id">Webhook *</Label>
          <Select
            value={formData.webhook_id}
            onValueChange={(value) => setFormData({ ...formData, webhook_id: value })}
            disabled={loading || dataLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select webhook" />
            </SelectTrigger>
            <SelectContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-2">
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading webhooks...</span>
                </div>
              ) : webhooks.length > 0 ? (
                webhooks.map((webhook) => (
                  <SelectItem key={webhook.id} value={webhook.id}>
                    {webhook.name}
                  </SelectItem>
                ))
              ) : (
                <div className="flex items-center justify-center py-2">
                  <span className="text-sm text-muted-foreground">No webhooks available</span>
                </div>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select the webhook endpoint to trigger content generation
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic / Title *</Label>
        <Input
          id="topic"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="Enter the main topic or title for your article"
          required
          disabled={loading}
          className={formData.topic && formData.topic.length < 3 ? "border-red-300 focus:border-red-500" : ""}
        />
        {formData.topic && formData.topic.length < 3 && (
          <p className="text-xs text-red-500">
            Topic must be at least 3 characters long
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          This will be used as the basis for AI-generated content
        </p>
      </div>

      {generationType === 'scheduled' && (
        <div className="space-y-2">
          <Label htmlFor="schedule_datetime">Schedule Generation Date & Time</Label>
          <Input
            id="schedule_datetime"
            type="datetime-local"
            value={formData.scheduled_datetime || ""}
            onChange={(e) => setFormData({ ...formData, scheduled_datetime: e.target.value })}
            min={new Date().toISOString().slice(0, 16)} // Only allow future dates/times
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Schedule when this article should be generated
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={loading || (!!formData.topic && formData.topic.length < 3)}
          className="min-w-[140px]"
        >
          {loading ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              {generationType === 'manual' ? 'Generating...' : 'Scheduling...'}
            </>
          ) : (
            <>
              <IconRocket className="mr-2 h-4 w-4" />
              {generationType === 'manual' ? 'Generate Article Now' : 'Schedule Article'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}