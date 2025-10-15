"use server"

import { createClient } from "@/lib/supabaseServices"
import { revalidatePath } from "next/cache"
import type { WebsiteFormData } from "./types"

export async function getWebsites() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("websites")
    .select(`
      *,
      companies:company_id (
        id,
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getWebsite(id: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("websites")
    .select(`
      *,
      companies:company_id (
        id,
        name,
        slug
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createWebsite(formData: WebsiteFormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("websites")
    .insert({
      name: formData.name,
      url: formData.url,
      description: formData.description || null,
      company_id: formData.company_id,
      status: formData.status,
    })
    .select()
    .single()

  if (error) throw error

  await logActivity({
    userId: user.id,
    action: "website_created",
    entityType: "website",
    entityId: data.id,
    companyId: formData.company_id,
    metadata: { name: formData.name, url: formData.url },
  })

  revalidatePath("/websites")
  return data
}

export async function updateWebsite(id: string, formData: Partial<WebsiteFormData>) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("websites")
    .update({
      name: formData.name,
      url: formData.url,
      description: formData.description || null,
      status: formData.status,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  await logActivity({
    userId: user.id,
    action: "website_updated",
    entityType: "website",
    entityId: id,
    metadata: { name: formData.name },
  })

  revalidatePath("/websites")
  return data
}

export async function deleteWebsite(id: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const website = await getWebsite(id)

  const { error } = await supabase
    .from("websites")
    .delete()
    .eq("id", id)

  if (error) throw error

  await logActivity({
    userId: user.id,
    action: "website_deleted",
    entityType: "website",
    entityId: id,
    companyId: website.company_id,
    metadata: { name: website.name },
  })

  revalidatePath("/websites")
}

export async function getCompanies() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug")
    .order("name")

  if (error) throw error
  return data || []
}

export async function testWebsiteConnection(id: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const website = await getWebsite(id)

  try {
    const response = await fetch(`${website.url}/wp-json/`)
    const data = await response.json()

    await supabase
      .from("websites")
      .update({
        wordpress_version: data.version || null,
        last_health_check: new Date().toISOString(),
        health_status: response.ok ? "healthy" : "error",
      })
      .eq("id", id)

    revalidatePath("/websites")
    return { success: true, data }
  } catch (error: any) {
    await supabase
      .from("websites")
      .update({
        last_health_check: new Date().toISOString(),
        health_status: "error",
      })
      .eq("id", id)

    revalidatePath("/websites")
    throw new Error("Failed to connect to WordPress site")
  }
}

async function logActivity(params: {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  companyId?: string
  metadata?: Record<string, any>
}) {
  const supabase = createClient()

  await supabase.from("user_activity_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    company_id: params.companyId,
    metadata: params.metadata || {},
  })
}
