'use client'

import React from 'react'
import { CheckCircle, Trophy, Star, Zap, TrendingUp, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from './scheduler-animations'
import { cn } from '@/lib/utils'

export interface SuccessMetric {
  label: string
  value: number
  prefix?: string
  suffix?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

export interface SuccessDisplayProps {
  title?: string
  message: string
  metrics?: SuccessMetric[]
  timestamp?: string
  showConfetti?: boolean
  actions?: React.ReactNode
  variant?: 'default' | 'celebration' | 'minimal' | 'detailed'
  className?: string
}

export function SuccessDisplay({
  title = 'Success!',
  message,
  metrics,
  timestamp,
  showConfetti = false,
  actions,
  variant = 'default',
  className
}: SuccessDisplayProps) {
  const [showAnimation, setShowAnimation] = React.useState(true)

  React.useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showAnimation])

  const renderConfetti = () => {
    if (!showConfetti) return null

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute w-2 h-2 animate-bounce',
              i % 4 === 0 && 'bg-red-400',
              i % 4 === 1 && 'bg-blue-400',
              i % 4 === 2 && 'bg-green-400',
              i % 4 === 3 && 'bg-yellow-400'
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2 text-green-700', className)}>
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium">{message}</span>
        {timestamp && (
          <span className="text-xs text-gray-500">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'relative rounded-lg border p-6 bg-green-50 border-green-200',
      showAnimation && 'animate-in fade-in duration-500',
      className
    )}>
      {renderConfetti()}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={cn(
            'w-12 h-12 rounded-full bg-green-100 flex items-center justify-center',
            showAnimation && 'animate-pulse'
          )}>
            {variant === 'celebration' ? (
              <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
          </div>
        </div>

        <div className="flex-1">
          {/* Title and Timestamp */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-green-900">
              {title}
            </h3>
            {variant === 'celebration' && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                Achievement
              </Badge>
            )}
            {timestamp && (
              <span className="text-sm text-gray-500 ml-auto">
                {new Date(timestamp).toLocaleString()}
              </span>
            )}
          </div>

          {/* Message */}
          <p className="text-green-800 mb-4">
            {message}
          </p>

          {/* Metrics */}
          {metrics && metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-white bg-opacity-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-700">
                      {metric.label}
                    </span>
                    {metric.trend && (
                      <div className={cn(
                        'flex items-center text-xs',
                        metric.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      )}>
                        <TrendingUp className={cn(
                          'h-3 w-3 mr-1',
                          metric.trend.direction === 'down' && 'rotate-180'
                        )} />
                        {metric.trend.value}%
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    <AnimatedCounter
                      value={metric.value}
                      prefix={metric.prefix}
                      suffix={metric.suffix}
                      duration={1500}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Success Timeline Component
interface SuccessEvent {
  id: string
  title: string
  description: string
  timestamp: string
  metrics?: SuccessMetric[]
  type: 'milestone' | 'achievement' | 'record' | 'improvement'
}

interface SuccessTimelineProps {
  events: SuccessEvent[]
  className?: string
}

export function SuccessTimeline({ events, className }: SuccessTimelineProps) {
  const getEventIcon = (type: SuccessEvent['type']) => {
    switch (type) {
      case 'milestone':
        return <Award className="h-4 w-4 text-blue-500" />
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 'record':
        return <Star className="h-4 w-4 text-purple-500" />
      case 'improvement':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getEventColor = (type: SuccessEvent['type']) => {
    switch (type) {
      case 'milestone':
        return 'border-blue-200 bg-blue-50'
      case 'achievement':
        return 'border-yellow-200 bg-yellow-50'
      case 'record':
        return 'border-purple-200 bg-purple-50'
      case 'improvement':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-200 to-blue-200" />

      {/* Events */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex items-start gap-4">
            {/* Timeline Icon */}
            <div className={cn(
              'w-12 h-12 rounded-full border-2 bg-white flex items-center justify-center z-10',
              getEventColor(event.type)
            )}>
              {getEventIcon(event.type)}
            </div>

            {/* Event Content */}
            <div className="flex-1 pb-6">
              <div className={cn(
                'rounded-lg border p-4',
                getEventColor(event.type)
              )}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {event.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  {event.description}
                </p>

                {event.metrics && event.metrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {event.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          <AnimatedCounter
                            value={metric.value}
                            prefix={metric.prefix}
                            suffix={metric.suffix}
                            duration={1000 + metricIndex * 100}
                          />
                        </div>
                        <div className="text-xs text-gray-600">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Success Summary Card
interface SuccessSummaryProps {
  totalSuccesses: number
  currentStreak: number
  bestStreak: number
  improvementRate: number
  lastSuccessTime?: string
  className?: string
}

export function SuccessSummary({
  totalSuccesses,
  currentStreak,
  bestStreak,
  improvementRate,
  lastSuccessTime,
  className
}: SuccessSummaryProps) {
  return (
    <div className={cn(
      'rounded-lg border p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200',
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">Success Summary</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            <AnimatedCounter value={totalSuccesses} duration={2000} />
          </div>
          <div className="text-xs text-gray-600">Total Successes</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            <AnimatedCounter value={currentStreak} duration={1500} />
          </div>
          <div className="text-xs text-gray-600">Current Streak</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            <AnimatedCounter value={bestStreak} duration={1800} />
          </div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            <AnimatedCounter value={improvementRate} suffix="%" duration={1200} />
          </div>
          <div className="text-xs text-gray-600">Improvement Rate</div>
        </div>
      </div>

      {lastSuccessTime && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Last success: {new Date(lastSuccessTime).toLocaleString()}
        </div>
      )}
    </div>
  )
}