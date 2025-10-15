export interface Website {
  id: string
  company_id: string
  name: string
  url: string
  description: string | null
  status: "active" | "inactive" | "maintenance"
  wordpress_version: string | null
  last_health_check: string | null
  health_status: "healthy" | "warning" | "error" | "unknown"
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WebsiteFormData {
  name: string
  url: string
  description?: string
  company_id: string
  status: "active" | "inactive" | "maintenance"
}
