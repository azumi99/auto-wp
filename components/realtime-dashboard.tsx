'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtimeArticles, useRealtimeWebsites, useRealtimeWebhooks, useRealtimeWorkflows } from './realtime-provider'
import {
  FileText,
  Globe,
  Webhook,
  Workflow,
  Wifi,
  WifiOff,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealtimeDashboardProps {
  userId: string
}

interface StatCardProps {
  title: string
  count: number
  icon: React.ReactNode
  description: string
  trend?: {
    value: number
    label: string
  }
  status?: 'success' | 'warning' | 'error' | 'info'
}

function StatCard({ title, count, icon, description, trend, status = 'info' }: StatCardProps) {
  const statusColors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50'
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", statusColors[status])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">
              +{trend.value} {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function RealtimeDashboard({ userId }: RealtimeDashboardProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [showDetails, setShowDetails] = useState(false)

  // Realtime data hooks
  const { articles, isConnected: articlesConnected, connectionError: articlesError } = useRealtimeArticles()
  const { websites, isConnected: websitesConnected, connectionError: websitesError } = useRealtimeWebsites()
  const { webhooks, isConnected: webhooksConnected, connectionError: webhooksError } = useRealtimeWebhooks()
  const { workflows, isConnected: workflowsConnected, connectionError: workflowsError } = useRealtimeWorkflows()

  // Calculate statistics
  const articlesStats = {
    total: articles?.length || 0,
    pending: articles?.filter(a => a.status === 'pending').length || 0,
    processing: articles?.filter(a => a.status === 'processing').length || 0,
    completed: articles?.filter(a => a.status === 'posted').length || 0,
    failed: articles?.filter(a => a.status === 'failed').length || 0,
    scheduled: articles?.filter(a => a.status === 'scheduled').length || 0
  }

  const websitesCount = websites?.length || 0
  const webhooksCount = webhooks?.length || 0
  const workflowsCount = workflows?.length || 0

  // Overall connection status
  const allConnected = articlesConnected && websitesConnected && webhooksConnected && workflowsConnected
  const hasErrors = !!(articlesError || websitesError || webhooksError || workflowsError)

  // Update last updated time when any data changes
  useEffect(() => {
    if (articles || websites || webhooks || workflows) {
      setLastUpdate(new Date())
    }
  }, [articles, websites, webhooks, workflows])

  const getStatusIcon = () => {
    if (hasErrors) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
    if (allConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />
    }
    return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
  }

  const getStatusText = () => {
    if (hasErrors) return 'Connection Error'
    if (allConnected) return 'Realtime Active'
    return 'Connecting...'
  }

  const getStatusColor = () => {
    if (hasErrors) return 'text-red-500'
    if (allConnected) return 'text-green-500'
    return 'text-yellow-500'
  }

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Realtime Dashboard
          </h2>
          <p className="text-muted-foreground">
            Live monitoring of your WordPress automation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Articles"
          count={articlesStats.total}
          icon={<FileText className="h-4 w-4" />}
          description="All articles in your system"
          status={articlesStats.failed > 0 ? 'warning' : 'info'}
          trend={{
            value: articlesStats.processing,
            label: 'processing now'
          }}
        />

        <StatCard
          title="Websites"
          count={websitesCount}
          icon={<Globe className="h-4 w-4" />}
          description="Connected WordPress sites"
          status={websitesCount > 0 ? 'success' : 'warning'}
        />

        <StatCard
          title="Webhooks"
          count={webhooksCount}
          icon={<Webhook className="h-4 w-4" />}
          description="Active webhook endpoints"
          status={webhooksCount > 0 ? 'success' : 'info'}
        />

        <StatCard
          title="Workflows"
          count={workflowsCount}
          icon={<Workflow className="h-4 w-4" />}
          description="Automation workflows"
          status={workflowsCount > 0 ? 'success' : 'info'}
        />
      </div>

      {/* Articles Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Articles Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold">{articlesStats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{articlesStats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg animate-pulse">
                <Loader2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">{articlesStats.processing}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">{articlesStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-semibold">{articlesStats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Details */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Realtime Connection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Table Connections</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Articles:</span>
                    <Badge variant={articlesConnected ? 'default' : 'destructive'}>
                      {articlesConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Websites:</span>
                    <Badge variant={websitesConnected ? 'default' : 'destructive'}>
                      {websitesConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Webhooks:</span>
                    <Badge variant={webhooksConnected ? 'default' : 'destructive'}>
                      {webhooksConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Workflows:</span>
                    <Badge variant={workflowsConnected ? 'default' : 'destructive'}>
                      {workflowsConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Live Data Counts</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Articles:</span>
                    <span>{articlesStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Websites:</span>
                    <span>{websitesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Webhooks:</span>
                    <span>{webhooksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workflows:</span>
                    <span>{workflowsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {(articlesError || websitesError || webhooksError || workflowsError) && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800">Connection Errors</h4>
                <div className="mt-2 text-sm text-red-700">
                  {articlesError && <p>Articles: {articlesError.message}</p>}
                  {websitesError && <p>Websites: {websitesError.message}</p>}
                  {webhooksError && <p>Webhooks: {webhooksError.message}</p>}
                  {workflowsError && <p>Workflows: {workflowsError.message}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Import Calendar component
import { Calendar } from 'lucide-react'