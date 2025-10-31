"use client"

import { useState, useEffect } from "react"
import { IconRefresh, IconTrendingUp, IconTrendingDown, IconArticle, IconWorldWww, IconBuilding, IconClockPlay, IconCheck, IconX, IconActivity, IconAlertTriangle, IconLogs, IconWifi, IconWifiOff } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getDashboardStats, getRecentActivity } from "@/src/lib/dashboard/client-actions"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatDateTime } from "@/src/lib/utils/date"
import MainLayout from "@/app/main"
import { RealtimeTest } from "@/components/realtime-test"
import { RealtimeDiagnostic } from "@/components/realtime-diagnostic"
import { createClient } from "@/lib/supabaseClient"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [systemLogs, setSystemLogs] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user ID for realtime tests
  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error('Error getting user ID:', error)
      }
    }
    getUserId()
  }, [])

  const loadMonitoringData = async () => {
    try {
      // Fetch real-time data for monitoring cards
      const [healthRes, logsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/system-logs?limit=10')
      ])

      // Health API - handle proper data structure
      if (healthRes.ok) {
        const healthResponse = await healthRes.json()
        const healthData = healthResponse.data || healthResponse
        setSystemHealth({
          status: healthData.status || 'healthy',
          message: healthData.message || healthData.description || 'All systems operational',
          services: healthData.services || {}
        })
      } else {
        setSystemHealth({
          status: 'error',
          message: 'Health API unavailable',
          services: {}
        })
      }

      // System Logs API - handle proper data structure
      if (logsRes.ok) {
        const logsResponse = await logsRes.json()
        const logsData = logsResponse.data || logsResponse

        const totalLogs = logsData.statistics?.total || logsData.pagination?.total || logsData.logs?.length || 0
        const byLevel = logsData.statistics?.byLevel || {}

        setSystemLogs({
          total: totalLogs,
          summary: {
            errors: byLevel.error || 0,
            warnings: byLevel.warning || 0,
            info: byLevel.info || 0
          }
        })
      } else {
        setSystemLogs({
          total: 0,
          summary: { errors: 0, warnings: 0 }
        })
      }
    } catch (error) {
      console.error('Error loading monitoring data:', error)
      // Set error states instead of fallback data
      setSystemHealth({
        status: 'error',
        message: 'Failed to load health data',
        services: {}
      })
      setSystemLogs({
        total: 0,
        summary: { errors: 0, warnings: 0 }
      })
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, activitiesData] = await Promise.all([
        getDashboardStats(timeRange),
        getRecentActivity(10),
      ])
      setStats(statsData)
      setActivities(activitiesData)

      // Also load monitoring data
      await loadMonitoringData()
    } catch (error: any) {
      toast.error(error.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeRange])

  // Auto-refresh monitoring data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMonitoringData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Format time ago for last run display
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
  }

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

  if (loading || !stats) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your content management system</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your content management system</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={loadData}>
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <IconArticle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_articles}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {stats.articles_change > 0 ? (
                <>
                  <IconTrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{stats.articles_change}%</span>
                </>
              ) : (
                <>
                  <IconTrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{stats.articles_change}%</span>
                </>
              )}
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Websites</CardTitle>
            <IconWorldWww className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_websites}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.healthy_websites} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successful_articles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.success_rate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <IconClockPlay className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.success_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successful_articles} published of {stats.total_articles} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* System Monitor Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <IconActivity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">System Monitor</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {!systemHealth ? (
              <div className="flex-1 space-y-2">
                <div className="animate-pulse">
                  <div className="h-8 bg-muted/50 rounded-lg w-24 mb-2"></div>
                  <div className="h-4 bg-muted/30 rounded w-full"></div>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${systemHealth?.status === 'healthy' ? 'bg-green-500' :
                    systemHealth?.status === 'warning' || systemHealth?.status === 'degraded' ? 'bg-yellow-500' :
                      systemHealth?.status === 'error' ? 'bg-red-500' : 'bg-green-500'
                    } animate-pulse`} />
                  <div className={`text-3xl font-bold bg-gradient-to-r ${systemHealth?.status === 'healthy' ? 'from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400' :
                    systemHealth?.status === 'warning' || systemHealth?.status === 'degraded' ? 'from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400' :
                      systemHealth?.status === 'error' ? 'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400' :
                        'from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400'
                    } bg-clip-text text-transparent`}>
                    {systemHealth?.status?.charAt(0).toUpperCase() + systemHealth?.status?.slice(1)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {systemHealth?.message || systemHealth?.description}
                </p>
              </div>
            )}
            <div className="mt-auto pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/50 font-medium"
                onClick={() => window.location.href = '/dashboard/monitoring'}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>



        {/* Recent Logs Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <IconLogs className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Logs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {!systemLogs ? (
              <div className="flex-1 space-y-2">
                <div className="animate-pulse">
                  <div className="h-8 bg-muted/50 rounded-lg w-20 mb-2"></div>
                  <div className="h-4 bg-muted/30 rounded w-full"></div>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${(systemLogs?.summary?.errors || 0) > 0 ? 'bg-red-500' :
                    (systemLogs?.summary?.warnings || 0) > 0 ? 'bg-yellow-500' :
                      systemLogs?.total > 0 ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                  <div className={`text-3xl font-bold bg-gradient-to-r ${(systemLogs?.summary?.errors || 0) > 0 ? 'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400' :
                    (systemLogs?.summary?.warnings || 0) > 0 ? 'from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400' :
                      systemLogs?.total > 0 ? 'from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400' :
                        'from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400'
                    } bg-clip-text text-transparent`}>
                    {systemLogs?.total || 0}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {systemLogs?.summary?.errors > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {systemLogs.summary.errors} error{systemLogs.summary.errors > 1 ? 's' : ''}
                    </span>
                  )}
                  {systemLogs?.summary?.errors > 0 && systemLogs?.summary?.warnings > 0 && <span className="mx-2">•</span>}
                  {systemLogs?.summary?.warnings > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {systemLogs.summary.warnings} warning{systemLogs.summary.warnings > 1 ? 's' : ''}
                    </span>
                  )}
                  {systemLogs?.summary?.errors === 0 && systemLogs?.summary?.warnings === 0 && systemLogs?.total > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {systemLogs.total} log{systemLogs.total > 1 ? 's' : ''}
                    </span>
                  )}
                  {systemLogs?.total === 0 && (
                    <span className="text-gray-500 dark:text-gray-500">No logs</span>
                  )}
                </div>
              </div>
            )}
            <div className="mt-auto pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50 font-medium"
                onClick={() => window.location.href = '/dashboard/logs'}
              >
                View Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Article Generation Trend</CardTitle>
            <CardDescription>Articles created over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.article_trend}>
                <defs>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorArticles)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles by Website</CardTitle>
            <CardDescription>Distribution across websites</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.articles_by_website}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Article Status Distribution</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.articles_by_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.articles_by_status.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">
                      {activity.action.includes("created") || activity.action.includes("success") ? (
                        <IconCheck className="h-4 w-4 text-green-500" />
                      ) : activity.action.includes("deleted") || activity.action.includes("failed") ? (
                        <IconX className="h-4 w-4 text-red-500" />
                      ) : (
                        <IconRefresh className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {formatAction(activity.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>

  )
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
