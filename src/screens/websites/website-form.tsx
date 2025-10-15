"use client"

import { useState, useEffect } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createWebsite, updateWebsite, getCompanies } from "@/src/lib/websites/actions"
import type { Website, WebsiteFormData } from "@/src/lib/websites/types"

interface WebsiteFormProps {
  website?: Website | null
  onSuccess: () => void
}

export function WebsiteForm({ website, onSuccess }: WebsiteFormProps) {
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: website?.name || "",
    url: website?.url || "",
    description: website?.description || "",
    company_id: website?.company_id || "",
    status: website?.status || "active",
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const data = await getCompanies()
      setCompanies(data)
      if (data.length > 0 && !formData.company_id) {
        setFormData(prev => ({ ...prev, company_id: data[0].id }))
      }
    } catch (error: any) {
      toast.error("Failed to load companies")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.url || !formData.company_id) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      if (website) {
        await updateWebsite(website.id, formData)
        toast.success("Website updated successfully")
      } else {
        await createWebsite(formData)
        toast.success("Website created successfully")
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Failed to save website")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_id">Company *</Label>
        <Select
          value={formData.company_id}
          onValueChange={(value) => setFormData({ ...formData, company_id: value })}
          disabled={loading || !!website}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Website Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Awesome Website"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Website URL *</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://example.com"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the website"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as WebsiteFormData["status"] })}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          {website ? "Update Website" : "Create Website"}
        </Button>
      </div>
    </form>
  )
}
