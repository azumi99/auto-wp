"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconWifi, IconWifiOff, IconRefresh, IconDatabase } from '@tabler/icons-react'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'

interface RealtimeTestProps {
  userId: string
  table: string
  label: string
}

export function RealtimeTest({ userId, table, label }: RealtimeTestProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<any>(null)
  const [eventCount, setEventCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channelName = `test-${table}-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log(`Realtime test event for ${table}:`, payload)
          setLastEvent(payload)
          setEventCount(prev => prev + 1)
          setIsConnected(true)

          // Show toast for new events
          toast.success(`${label} ${payload.eventType}: ${payload.new?.id || payload.old?.id}`)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          console.log(`Test realtime subscription active for ${table}`)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          console.error(`Test realtime subscription failed for ${table}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, table, label])

  const testConnection = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Perform a simple test update to trigger realtime
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // Update the updated_at field to trigger a realtime event
        const { error: updateError } = await supabase
          .from(table)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.id)
          .eq('user_id', userId)

        if (updateError) throw updateError

        toast.success('Test update sent - check for realtime events')
      } else {
        toast.info(`No ${label} found to test with`)
      }
    } catch (error: any) {
      console.error('Test connection error:', error)
      toast.error(`Test failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{label} Realtime</CardTitle>
          <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
            {isConnected ? (
              <>
                <IconWifi className="w-3 h-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <IconWifiOff className="w-3 h-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Realtime subscription for {table}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span>Events received:</span>
          <Badge variant="outline">{eventCount}</Badge>
        </div>

        {lastEvent && (
          <div className="text-xs space-y-1">
            <div className="font-medium">Last event:</div>
            <div className="bg-muted p-2 rounded text-xs overflow-hidden">
              <div>Type: {lastEvent.eventType}</div>
              <div>ID: {lastEvent.new?.id || lastEvent.old?.id}</div>
              <div>Time: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={testConnection}
          disabled={loading || !isConnected}
          className="w-full text-xs"
        >
          <IconRefresh className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          <IconDatabase className="w-3 h-3 mr-1" />
          Test Connection
        </Button>
      </CardContent>
    </Card>
  )
}