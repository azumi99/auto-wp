'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ErrorBoundary } from '@/components/error-boundary'
import MainLayout from '@/app/main'
import {
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  Download,
  Zap,
  TrendingUp
} from 'lucide-react'
import { ErrorDisplay, useErrorManager } from '@/components/error-display'
import { SuccessDisplay, SuccessSummary } from '@/components/success-display'

interface MonitoringStats {
  totalRuns: number
  successRate: number
  averageRunTime: number
  uptime: number
  lastHourRuns: number
  lastDayRuns: number
}

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [health, setHealth] = useState<any>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const {
    errors,
    addError,
    dismissError,
    clearAll,
    hasErrors,
    errorCount,
    criticalErrors
  } = useErrorManager()

  const fetchStats = async () => {
    try {
      setIsRefreshing(true)

      // Fetch health and recent logs in parallel
      const [healthResponse, logsResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/test-logs?limit=24') // Get recent 24 logs
      ])

      if (!healthResponse.ok) throw new Error('Failed to fetch health status')
      if (!logsResponse.ok) throw new Error('Failed to fetch recent logs')

      const healthData = await healthResponse.json()
      const logsData = await logsResponse.json()

      // Set default stats since scheduler is removed
      setStats({
        totalRuns: 0,
        successRate: 0,
        averageRunTime: 0,
        uptime: 0,
        lastHourRuns: 0,
        lastDayRuns: 0
      })
      setHealth(healthData.data)
      setRecentLogs(logsData.data?.logs || [])
    } catch (error) {
      addError({
        type: 'error',
        title: 'Failed to fetch system data',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleExportLogs = async () => {
    try {
      const response = await fetch('/api/scheduler/export')
      if (!response.ok) throw new Error('Failed to export logs')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scheduler-logs-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      addError({
        type: 'success',
        title: 'Export Successful',
        message: 'Logs have been exported successfully'
      })
    } catch (error) {
      addError({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export logs'
      })
    }
  }

  return (
    <MainLayout>
      <ErrorBoundary
      onError={(error, errorInfo) => {
        addError({
          type: 'critical',
          title: 'Dashboard Error',
          message: 'The monitoring dashboard encountered an error',
          details: `${error.name}: ${error.message}\n${errorInfo.componentStack}`
        })
      }}
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8 text-blue-500" />
              Monitoring Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time monitoring and management of your scheduled tasks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchStats}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(
                'h-4 w-4 mr-1',
                isRefreshing && 'animate-spin'
              )} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="h-4 w-4 mr-1" />
              Export Logs
            </Button>
          </div>
        </div>





        {/* Errors and Alerts */}
        {hasErrors && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn(
                    'h-5 w-5',
                    criticalErrors > 0 ? 'text-red-500' : 'text-yellow-500'
                  )} />
                  System Alerts ({errorCount})
                </div>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {errors.slice(0, 5).map(error => (
                  <ErrorDisplay
                    key={error.id}
                    type={error.type}
                    title={error.title}
                    message={error.message}
                    details={error.details}
                    timestamp={error.timestamp}
                    dismissible
                    onDismiss={() => dismissError(error.id)}
                  />
                ))}
                {errors.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 5 of {errors.length} alerts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Monitoring Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Recent Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentLogs.length > 0 ? (
                    <div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {recentLogs.slice(0, 5).map((log, index) => (
                          <div key={log.id} className="flex items-start gap-2 text-xs">
                            <div className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0 mt-0.5',
                              log.level === 'error' ? 'bg-red-500' :
                              log.level === 'warn' ? 'bg-yellow-500' :
                              log.level === 'info' ? 'bg-blue-500' :
                              'bg-gray-500'
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{log.source}</span>
                                <span className="text-muted-foreground text-xs">
                                  {formatTimeAgo(new Date(log.created_at))}
                                </span>
                              </div>
                              <p className="text-muted-foreground truncate">{log.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">
                            {recentLogs.filter(log => log.level === 'error').length} errors, {recentLogs.filter(log => log.level === 'warn').length} warnings
                          </span>
                          <span className="text-muted-foreground">
                            Last {recentLogs.length} logs
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent logs</p>
                  )}
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      System Health
                    </div>
                    {health && (
                      <Badge
                        variant={health.status === 'healthy' ? 'default' :
                                  health.status === 'degraded' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {health.status.toUpperCase()}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {health ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium">Database</span>
                          <p className="text-xs text-muted-foreground">{health.services.database.message}</p>
                        </div>
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          health.services.database.status === 'healthy' ? 'bg-green-500' :
                          health.services.database.status === 'unhealthy' ? 'bg-red-500' : 'bg-yellow-500'
                        )} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium">Database Connection</span>
                          <p className="text-xs text-muted-foreground">{health.services.database.message}</p>
                        </div>
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          health.services.database.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                        )} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium">Webhook Service</span>
                          <p className="text-xs text-muted-foreground">{health.services.webhooks.message}</p>
                        </div>
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          health.services.webhooks.status === 'healthy' ? 'bg-green-500' :
                          health.services.webhooks.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium">AI Service</span>
                          <p className="text-xs text-muted-foreground">{health.services.ai.message}</p>
                        </div>
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          health.services.ai.status === 'healthy' ? 'bg-green-500' :
                          health.services.ai.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed analytics and performance metrics will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitoring configuration and alert settings will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
    </MainLayout>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// Format time ago (e.g., "2 min ago", "in 5 min")
function formatTimeAgo(date: Date, isFuture = false) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (isFuture) {
    // Future times (for next run)
    const diffInMinutes = Math.floor(Math.abs(diffInSeconds) / 60)
    if (diffInMinutes < 1) return 'in less than 1 min'
    if (diffInMinutes < 60) return `in ${diffInMinutes} min`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`

    const diffInDays = Math.floor(diffInHours / 24)
    return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`
  } else {
    // Past times (for last run)
    if (diffInSeconds < 10) return 'just now'
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
}