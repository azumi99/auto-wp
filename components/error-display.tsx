'use client'

import React from 'react'
import { AlertTriangle, XCircle, Info, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ErrorType = 'error' | 'warning' | 'info' | 'success' | 'critical'

export interface ErrorDisplayProps {
  type?: ErrorType
  title?: string
  message: string
  details?: string
  timestamp?: string
  dismissible?: boolean
  onDismiss?: () => void
  actions?: React.ReactNode
  className?: string
}

const errorConfig = {
  critical: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-800'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-800'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500',
    badgeColor: 'bg-yellow-100 text-yellow-800'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-500',
    badgeColor: 'bg-green-100 text-green-800'
  }
}

export function ErrorDisplay({
  type = 'error',
  title,
  message,
  details,
  timestamp,
  dismissible = true,
  onDismiss,
  actions,
  className
}: ErrorDisplayProps) {
  const config = errorConfig[type]
  const Icon = config.icon
  const [showDetails, setShowDetails] = React.useState(false)

  const handleDismiss = () => {
    onDismiss?.()
  }

  return (
    <div className={cn(
      'rounded-lg border p-4 relative',
      config.bgColor,
      config.borderColor,
      className
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title and Badge */}
          <div className="flex items-center gap-2 mb-1">
            {title && (
              <h3 className={cn('font-semibold', config.textColor)}>
                {title}
              </h3>
            )}
            <Badge className={cn('text-xs', config.badgeColor)}>
              {type.toUpperCase()}
            </Badge>
            {timestamp && (
              <span className="text-xs text-gray-500 ml-auto">
                {new Date(timestamp).toLocaleString()}
              </span>
            )}
          </div>

          {/* Message */}
          <p className={cn('text-sm', config.textColor)}>
            {message}
          </p>

          {/* Details Toggle */}
          {details && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={cn(
                  'text-xs font-medium underline-offset-4 hover:underline',
                  config.textColor
                )}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>

              {showDetails && (
                <div className={cn(
                  'mt-2 p-3 rounded text-xs font-mono whitespace-pre-wrap break-all',
                  config.bgColor,
                  'border',
                  config.borderColor
                )}>
                  {details}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors',
              config.textColor
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Error List Component
interface ErrorListProps {
  errors: Array<{
    id: string
    type?: ErrorType
    title?: string
    message: string
    details?: string
    timestamp?: string
  }>
  onDismiss?: (id: string) => void
  onClearAll?: () => void
  maxItems?: number
  className?: string
}

export function ErrorList({
  errors,
  onDismiss,
  onClearAll,
  maxItems = 10,
  className
}: ErrorListProps) {
  const [filter, setFilter] = React.useState<ErrorType | 'all'>('all')

  const filteredErrors = errors
    .filter(error => filter === 'all' || error.type === filter)
    .slice(0, maxItems)

  const errorCounts = errors.reduce((counts, error) => {
    const type = error.type || 'error'
    counts[type] = (counts[type] || 0) + 1
    return counts
  }, {} as Record<ErrorType, number>)

  if (errors.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>No errors or warnings</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          System Messages ({errors.length})
        </h3>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {(['all', 'critical', 'error', 'warning', 'info'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                filter === type
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type === 'all' ? 'All' : type}
              {type !== 'all' && errorCounts[type] && (
                <span className="ml-1">({errorCounts[type]})</span>
              )}
            </button>
          ))}

          {onClearAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="ml-2"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Error List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredErrors.map(error => (
          <ErrorDisplay
            key={error.id}
            type={error.type}
            title={error.title}
            message={error.message}
            details={error.details}
            timestamp={error.timestamp}
            dismissible={!!onDismiss}
            onDismiss={() => onDismiss?.(error.id)}
          />
        ))}

        {filteredErrors.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">
              No {filter === 'all' ? '' : filter} messages found
            </p>
          </div>
        )}
      </div>

      {errors.length > maxItems && (
        <p className="text-xs text-gray-500 text-center">
          Showing {maxItems} of {errors.length} messages
        </p>
      )}
    </div>
  )
}

// Hook for managing errors
export function useErrorManager() {
  const [errors, setErrors] = React.useState<Array<ErrorDisplayProps & { id: string }>>([])

  const addError = React.useCallback((
    error: Omit<ErrorDisplayProps, 'id'> & { id?: string }
  ) => {
    const id = error.id || `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setErrors(prev => [{ ...error, id }, ...prev].slice(0, 50)) // Keep max 50 errors
  }, [])

  const dismissError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearAll = React.useCallback(() => {
    setErrors([])
  }, [])

  const clearByType = React.useCallback((type: ErrorType) => {
    setErrors(prev => prev.filter(error => error.type !== type))
  }, [])

  return {
    errors,
    addError,
    dismissError,
    clearAll,
    clearByType,
    hasErrors: errors.length > 0,
    errorCount: errors.length,
    criticalErrors: errors.filter(e => e.type === 'critical').length,
    regularErrors: errors.filter(e => e.type === 'error').length,
    warnings: errors.filter(e => e.type === 'warning').length
  }
}