// Realtime Reconnection Patch
// Add this to your existing use-supabase-realtime.ts file to fix sleep/wake issues

import { useEffect, useRef } from 'react'

export const useRealtimeReconnectPatch = (
  isConnected: boolean,
  channel: any,
  supabase: any,
  options: any,
  reconnect: () => void,
  setError: (error: Error) => void
) => {
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const maxReconnectAttempts = 3
  const reconnectAttemptsRef = useRef(0)

  // Detect page visibility changes (sleep/wake)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log(`Page became visible, attempting to reconnect to ${options.table}`)
        reconnectAttemptsRef.current = 0
        attemptReconnect()
      }
    }

    const handleOnline = () => {
      if (!isConnected) {
        console.log(`Network restored, attempting to reconnect to ${options.table}`)
        reconnectAttemptsRef.current = 0
        attemptReconnect()
      }
    }

    const handleOffline = () => {
      console.log(`Network lost, marking ${options.table} as disconnected`)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [isConnected, options.table, reconnect])

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${options.table}`)
      setError(new Error(`Failed to connect after ${maxReconnectAttempts} attempts`))
      return
    }

    console.log(`Attempting reconnection ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} for ${options.table}`)

    // Clean up existing channel
    if (channel) {
      supabase.removeChannel(channel)
    }

    // Increment attempts
    reconnectAttemptsRef.current += 1

    // Delay reconnection
    setTimeout(() => {
      console.log('Triggering reconnect...')
      reconnect()
    }, 2000 * reconnectAttemptsRef.current) // Exponential backoff
  }

  // Auto-reconnect on connection error
  useEffect(() => {
    if (!isConnected && !reconnectTimeoutRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Auto-reconnecting due to lost connection...')
        attemptReconnect()
      }, 5000) // Wait 5 seconds before auto-reconnect
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = undefined
      }
    }
  }, [isConnected, reconnect, options.table])

  return { attemptReconnect }
}