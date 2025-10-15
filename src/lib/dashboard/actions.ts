"use server"

import { createClient } from "@/lib/supabaseServices"

export async function getDashboardStats(timeRange: string = "7d") {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)

  const { count: totalArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })

  const { count: recentArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString())

  const { count: totalWebsites } = await supabase
    .from("websites")
    .select("*", { count: "exact", head: true })

  const { count: healthyWebsites } = await supabase
    .from("websites")
    .select("*", { count: "exact", head: true })
    .eq("health_status", "healthy")

  const { count: totalCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })

  const { count: activeCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { count: publishedArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")

  const successRate = totalArticles
    ? Math.round(((publishedArticles || 0) / totalArticles) * 100)
    : 0

  const articleTrend = await getArticleTrend(daysAgo)
  const articlesByWebsite = await getArticlesByWebsite()
  const articlesByStatus = await getArticlesByStatus()

  return {
    total_articles: totalArticles || 0,
    articles_change: Math.round(((recentArticles || 0) / Math.max(1, (totalArticles || 1) - (recentArticles || 0))) * 100),
    total_websites: totalWebsites || 0,
    healthy_websites: healthyWebsites || 0,
    total_companies: totalCompanies || 0,
    active_companies: activeCompanies || 0,
    success_rate: successRate,
    successful_articles: publishedArticles || 0,
    article_trend: articleTrend,
    articles_by_website: articlesByWebsite,
    articles_by_status: articlesByStatus,
  }
}

async function getArticleTrend(days: number) {
  const supabase = createClient()

  const dates: Array<{ date: string; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push({
      date: date.toISOString().split("T")[0],
      count: 0,
    })
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data } = await supabase
    .from("articles")
    .select("created_at")
    .gte("created_at", startDate.toISOString())

  if (data) {
    data.forEach((article) => {
      const articleDate = new Date(article.created_at).toISOString().split("T")[0]
      const dateEntry = dates.find((d) => d.date === articleDate)
      if (dateEntry) {
        dateEntry.count++
      }
    })
  }

  return dates.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: d.count,
  }))
}

async function getArticlesByWebsite() {
  const supabase = createClient()

  const { data } = await supabase
    .from("articles")
    .select(`
      website_id,
      websites:website_id (
        name
      )
    `)

  if (!data) return []

  const websiteCounts: Record<string, { name: string; count: number }> = {}

  data.forEach((article: any) => {
    const websiteName = article.websites?.name || "Unknown"
    if (!websiteCounts[websiteName]) {
      websiteCounts[websiteName] = { name: websiteName, count: 0 }
    }
    websiteCounts[websiteName].count++
  })

  return Object.values(websiteCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

async function getArticlesByStatus() {
  const supabase = createClient()

  const { data } = await supabase
    .from("articles")
    .select("status")

  if (!data) return []

  const statusCounts: Record<string, number> = {}

  data.forEach((article) => {
    const status = article.status || "unknown"
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  return Object.entries(statusCounts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
  }))
}

export async function getRecentActivity(limit: number = 10) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data } = await supabase
    .from("user_activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  return data || []
}
