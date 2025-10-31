'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Globe,
  Timer,
  Wifi,
  WifiOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useArticlesRealtime } from '@/hooks/use-supabase-realtime'

// Simple Progress component fallback
const Progress = ({ value, className }: { value?: number; className?: string }) => {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}>
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  )
}

interface Article {
  id: string
  title: string
  scheduled_at: string
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'scheduled'
  generation_progress?: number
  generation_message?: string
  websites?: {
    name: string
    url: string
  }
  webhooks?: {
    name: string
  }
}

interface ArticleProgressTrackerProps {
  articles: Article[]
  userId: string
  onRefresh?: () => void
  className?: string
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    icon: Clock,
    description: 'Waiting to be processed'
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Calendar,
    description: 'Scheduled for generation'
  },
  processing: {
    label: 'Processing',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: Loader2,
    description: 'Currently being generated',
    animated: true
  },
  posted: {
    label: 'Completed',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: CheckCircle,
    description: 'Successfully generated and posted'
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: XCircle,
    description: 'Generation failed'
  }
}

export function ArticleProgressTracker({
  articles,
  userId,
  onRefresh,
  className
}: ArticleProgressTrackerProps) {
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Realtime subscription for articles
  const {
    data: realtimeArticles,
    error: realtimeError,
    loading: realtimeLoading,
    subscribe,
    unsubscribe
  } = useArticlesRealtime(userId, articles)

  // Log realtime updates for debugging
  useEffect(() => {
    if (realtimeArticles) {
      console.log('Realtime articles updated:', realtimeArticles)
    }
  }, [realtimeArticles])

  // Initialize realtime subscription
  useEffect(() => {
    if (realtimeEnabled && !realtimeLoading && !realtimeError) {
      subscribe()
    }

    return () => {
      if (realtimeEnabled) {
        unsubscribe()
      }
    }
  }, [realtimeEnabled, subscribe, unsubscribe, realtimeLoading, realtimeError])

  // Update last updated time when realtime data changes
  useEffect(() => {
    if (realtimeArticles) {
      setLastUpdated(new Date())
      onRefresh?.()
    }
  }, [realtimeArticles, onRefresh])

  // Use realtime data if available, otherwise fall back to props
  const currentArticles = realtimeArticles || articles

  const toggleExpand = (articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(articleId)) {
        newSet.delete(articleId)
      } else {
        newSet.add(articleId)
      }
      return newSet
    })
  }

  const formatScheduledTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()

    if (diffMs < 0) {
      return `Scheduled ${Math.abs(Math.floor(diffMs / 60000))} minutes ago`
    }

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) {
      return `In ${diffMins} minutes`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`
    }

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusIcon = (status: keyof typeof statusConfig) => {
    const Icon = statusConfig[status].icon
    const animated = statusConfig[status].animated

    return (
      <Icon
        className={cn(
          'h-4 w-4',
          animated && 'animate-spin'
        )}
      />
    )
  }

  // Show connection status
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 text-sm">
      {realtimeError ? (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-red-500">Realtime disconnected</span>
        </>
      ) : realtimeLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
          <span className="text-yellow-500">Connecting...</span>
        </>
      ) : realtimeEnabled ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Realtime active</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-gray-500" />
          <span className="text-gray-500">Realtime paused</span>
        </>
      )}
    </div>
  )

  if (!currentArticles || currentArticles.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Scheduled Articles
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            You don't have any scheduled articles. Create and schedule articles to see their progress here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Scheduled Articles ({currentArticles.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (realtimeEnabled) {
                  unsubscribe()
                  setRealtimeEnabled(false)
                } else {
                  subscribe()
                  setRealtimeEnabled(true)
                }
              }}
            >
              {realtimeEnabled ? 'Pause Realtime' : 'Resume Realtime'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRefresh?.()
                setLastUpdated(new Date())
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentArticles.map((article) => {
          const status = article.status as keyof typeof statusConfig
          const config = statusConfig[status]
          const isExpanded = expandedArticles.has(article.id)

          return (
            <div
              key={article.id}
              className={cn(
                'border rounded-lg p-4 transition-all duration-200',
                config.bgColor,
                'hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      'p-2 rounded-full',
                      config.color
                    )}>
                      {getStatusIcon(status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatScheduledTime(article.scheduled_at)}
                        </span>
                        {article.websites && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {article.websites.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      className={cn(config.textColor, config.bgColor)}
                      variant="secondary"
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {config.description}
                    </span>
                  </div>

                  {/* Progress bar for processing articles */}
                  {status === 'processing' && article.generation_progress !== undefined && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Generation Progress</span>
                        <span>{article.generation_progress}%</span>
                      </div>
                      <Progress value={article.generation_progress} className="h-2" />
                    </div>
                  )}

                  {/* Status message */}
                  {article.generation_message && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {article.generation_message}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(article.id)}
                  className="ml-2"
                >
                  {isExpanded ? 'Collapse' : 'Details'}
                </Button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Article ID:</span>
                      <p className="text-muted-foreground font-mono text-xs">
                        {article.id.slice(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Scheduled Time:</span>
                      <p className="text-muted-foreground">
                        {new Date(article.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    {article.webhooks && (
                      <div>
                        <span className="font-medium">Webhook:</span>
                        <p className="text-muted-foreground">
                          {article.webhooks.name}
                        </p>
                      </div>
                    )}
                    {article.websites && (
                      <div>
                        <span className="font-medium">Website:</span>
                        <p className="text-muted-foreground">
                          <a
                            href={article.websites.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {article.websites.url}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}