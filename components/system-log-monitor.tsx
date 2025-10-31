'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
  XCircle,
  Info,
  Bug,
  Search,
  Calendar,
  User
} from 'lucide-react'

interface SystemLog {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
  user_id?: string
  metadata?: Record<string, any>
  created_at: string
  details?: any
}

interface LogStats {
  total: number
  byLevel: Record<string, number>
  bySource: Record<string, number>
}

interface LogResponse {
  success: boolean
  data: {
    logs: SystemLog[]
    statistics: LogStats
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    timeRange: string
    filters: {
      level?: string
      source?: string
    }
  }
}

const levelConfig = {
  info: { label: 'Info', color: 'bg-blue-500', icon: Info, textColor: 'text-blue-700' },
  warn: { label: 'Warning', color: 'bg-yellow-500', icon: AlertTriangle, textColor: 'text-yellow-700' },
  error: { label: 'Error', color: 'bg-red-500', icon: XCircle, textColor: 'text-red-700' },
  debug: { label: 'Debug', color: 'bg-gray-500', icon: Bug, textColor: 'text-gray-700' }
}

const timeRanges = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
]

export function SystemLogMonitor() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [stats, setStats] = useState<LogStats>({ total: 0, byLevel: {}, bySource: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    level: 'all',
    source: 'all',
    timeRange: '24h'
  })
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async (reset = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: reset ? '0' : pagination.offset.toString(),
        timeRange: filters.timeRange,
        ...(filters.level !== 'all' && { level: filters.level }),
        ...(filters.source !== 'all' && { source: filters.source })
      })

      // Try system-logs API first
      let response = await fetch(`/api/system-logs?${params}`)
      let data: LogResponse = await response.json()

      // If system-logs API fails, try test-logs API
      if (!data.success && (data.error?.includes('table') || data.code === 'TABLE_NOT_FOUND')) {
        console.log('System logs table not found, using test logs...')
        response = await fetch(`/api/test-logs?${params}`)
        data = await response.json()
      }

      if (data.success) {
        if (reset) {
          setLogs(data.data.logs)
          setPagination({ ...pagination, offset: 0, ...data.data.pagination })
        } else {
          setLogs(prev => [...prev, ...data.data.logs])
          setPagination(prev => ({ ...prev, ...data.data.pagination }))
        }
        setStats(data.data.statistics)

        // Show notification if using test logs
        if (data.data.note) {
          console.log(data.data.note)
          setError(data.data.note)
        }
      } else {
        setError(data.error || 'Failed to fetch logs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))
      fetchLogs()
    }
  }

  const refresh = () => {
    fetchLogs(true)
  }

  useEffect(() => {
    fetchLogs(true)
  }, [filters.level, filters.source, filters.timeRange])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs(true)
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, filters])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getLevelIcon = (level: string) => {
    const config = levelConfig[level as keyof typeof levelConfig]
    return config ? React.createElement(config.icon, { className: "h-4 w-4" }) : null
  }

  const getLevelBadge = (level: string) => {
    const config = levelConfig[level as keyof typeof levelConfig]
    if (!config) return null

    return (
      <Badge variant="outline" className={`${config.textColor} border-current`}>
        {getLevelIcon(level)}
        <span className="ml-1">{config.label}</span>
      </Badge>
    )
  }

  const renderMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
        <div className="font-semibold text-gray-600 mb-1">Metadata:</div>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="text-gray-600">
              <span className="font-medium">{key}:</span>{' '}
              <span className="text-gray-800">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Log Monitor
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                <Clock className="h-4 w-4 mr-1" />
                Auto-refresh: {autoRefresh ? 'On' : 'Off'}
              </Button>
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="h-4 w-4" />
                <span className="font-semibold text-sm">Info</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.byLevel.info || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold text-sm">Warnings</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.byLevel.warn || 0}
              </p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-4 w-4" />
                <span className="font-semibold text-sm">Errors</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {stats.byLevel.error || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700">
                <Bug className="h-4 w-4" />
                <span className="font-semibold text-sm">Debug</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">
                {stats.byLevel.debug || 0}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Level:</span>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Time:</span>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                className="px-3 py-1 border rounded text-sm"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recent Logs ({logs.length} of {pagination.total})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs found for the selected filters
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 border rounded-lg ${
                    log.level === 'error' ? 'border-red-200 bg-red-50' :
                    log.level === 'warn' ? 'border-yellow-200 bg-yellow-50' :
                    log.level === 'debug' ? 'border-gray-200 bg-gray-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getLevelBadge(log.level)}
                        <Badge variant="outline" className="text-xs">
                          {log.source}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        log.level === 'error' ? 'text-red-800' :
                        log.level === 'warn' ? 'text-yellow-800' :
                        log.level === 'debug' ? 'text-gray-800' :
                        'text-blue-800'
                      }`}>
                        {log.message}
                      </p>
                      {renderMetadata(log.metadata)}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="font-semibold text-gray-600 mb-1">Details:</div>
                          <div className="grid grid-cols-2 gap-1 text-gray-600">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="text-gray-800 text-xs">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {pagination.hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}