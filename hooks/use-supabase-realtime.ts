'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeSubscriptionOptions {
  table: string
  filter?: string
  userId?: string
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  schema?: string
}

interface UseRealtimeReturn<T> {
  data: T[] | null
  error: Error | null
  loading: boolean
  subscribe: () => void
  unsubscribe: () => void
  channel: RealtimeChannel | null
  reconnect: () => void
  isConnected: boolean
  lastConnected?: Date
}

export function useSupabaseRealtime<T = any>(
  initialData: T[] | null = null,
  options: RealtimeSubscriptionOptions
): UseRealtimeReturn<T> {
  const [data, setData] = useState<T[] | null>(initialData)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastConnected, setLastConnected] = useState<Date | undefined>()
  const [isManualDisconnect, setIsManualDisconnect] = useState(false)

  const supabase = createClient()
  const isMounted = useRef(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!options.filter) {
      console.warn(`No filter provided for ${options.table}`)
      setLoading(false)
      return
    }

    try {
      console.log(`Fetching initial data for ${options.table}`)

      // Extract user_id from filter
      const userIdMatch = options.filter.match(/user_id=eq\.([^&]+)/)
      console.log(`Extracted user_id: ${userIdMatch ? userIdMatch[1] : 'none'}`)
      if (!userIdMatch) {
        // console.error('Could not extract user_id from filter')
        setLoading(false)
        return
      }

      const userId = userIdMatch[1]


      // Build query
      let query = supabase
        .from(options.table)
        .select('*')
        .eq('user_id', userId)

      // Special handling for articles table
      if (options.table === 'articles') {
        query = supabase
          .from(options.table)
          .select(`
            *,
            websites(id, name, url),
            webhooks(id, name)
          `)
          .eq('user_id', userId)
      }

      const { data: fetchedData, error: fetchError } = await query
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error(`Error fetching data for ${options.table}:`, fetchError)
        setError(fetchError)
      } else {
        console.log(` Fetched ${fetchedData?.length || 0} items for ${options.table}`)
        setData(fetchedData as T[])
      }
    } catch (err) {
      console.error(`Error in fetchInitialData:`, err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [options.table, options.filter, supabase])

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (isManualDisconnect) return
    if (!options.filter) {
      console.warn(`No filter provided for ${options.table}`)
      return
    }

    console.log(`Setting up realtime for ${options.table}`)

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Create unique channel name
    const channelName = `realtime-${options.table}-${Date.now()}`

    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,

        },
        (payload: any) => {
          if (!isMounted.current) return

          console.log(`📡 Realtime event for ${options.table}:`, payload.eventType, payload)

          setData((currentData) => {
            if (!isMounted.current) return currentData

            switch (payload.eventType) {
              case 'INSERT':
                if (options.table === 'articles') {
                  // Fetch the full article with joins (websites, webhooks)
                  supabase
                    .from('articles')
                    .select(`
                      *,
                      websites(id, name, url),
                      webhooks(id, name)
                    `)
                    .eq('id', payload.new.id)
                    .single()
                    .then(({ data: newArticle, error }) => {
                      if (error) {
                        console.error('Error fetching full article after insert:', error)
                        return
                      }

                      setData((currentData) => {
                        if (!isMounted.current) return currentData
                        const exists = currentData?.some((item) => (item as any).id === newArticle.id)
                        if (exists) return currentData
                        console.log(` INSERT: Added full joined article.`)
                        return currentData ? [newArticle as T, ...currentData] : [newArticle as T]
                      })
                    })
                } else {
                  // Default: just use the payload
                  setData((currentData) => {
                    if (!isMounted.current) return currentData
                    const newData = currentData ? [payload.new as T, ...currentData] : [payload.new as T]
                    console.log(` INSERT: Added item. Total: ${newData.length}`)
                    return newData
                  })
                }
                return currentData


              case 'UPDATE':
                if (options.table === 'articles') {
                  // Fetch the full article with joins (websites, webhooks)
                  supabase
                    .from('articles')
                    .select(`
                      *,
                      websites(id, name, url),
                      webhooks(id, name)
                    `)
                    .eq('id', payload.new.id)
                    .single()
                    .then(({ data: updatedArticle, error }) => {
                      if (error) {
                        console.error('Error fetching full article after update:', error)
                        return
                      }

                      setData((currentData) => {
                        if (!isMounted.current) return currentData
                        const updatedData = currentData?.map(item =>
                          (item as any).id === updatedArticle.id ? updatedArticle as T : item
                        ) || null
                        console.log(` UPDATE: Updated full joined article. Total: ${updatedData?.length || 0}`)
                        return updatedData
                      })
                    })
                } else {
                  // Default: just use the payload
                  const updatedData = currentData?.map(item =>
                    (item as any).id === payload.new.id ? payload.new as T : item
                  ) || null
                  console.log(` UPDATE: Updated item. Total: ${updatedData?.length || 0}`)
                  return updatedData
                }
                return currentData

              case 'DELETE':
                const filteredData = currentData?.filter(item =>
                  (item as any).id !== payload.old.id
                ) || null
                console.log('halohalo', currentData?.filter(item => (item as any).id !== payload.old.id))
                console.log(` DELETE: Removed item. Total: ${filteredData?.length || 0}`)
                return filteredData

              default:
                return currentData
            }
          })
        }
      )
      .subscribe((status, err) => {
        if (!isMounted.current) return

        console.log(`Subscription status for ${options.table}:`, status)

        if (status === 'SUBSCRIBED') {
          console.log(` Connected to ${options.table} realtime`)
          setIsConnected(true)
          setError(null)
          setLastConnected(new Date())
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // console.error(` Connection error for ${options.table}:`, err)
          setIsConnected(false)
          // setError(new Error(err?.message || 'Connection error'))
        } else if (status === 'CLOSED') {
          console.log(`Connection closed for ${options.table}`)
          setIsConnected(false)
        }
      })

    channelRef.current = newChannel
    setChannel(newChannel)
  }, [options, supabase, isManualDisconnect])

  // Initialize: Fetch data then setup realtime
  useEffect(() => {
    isMounted.current = true

    const initialize = async () => {
      await fetchInitialData()
      setupRealtimeSubscription()
    }

    initialize()

    return () => {
      isMounted.current = false
      if (channelRef.current) {
        console.log(`Cleaning up ${options.table} subscription`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [options.table, options.filter]) // <--- tambahkan dependency ini



  // Handle visibility change (sleep/wake)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && !isManualDisconnect) {
        console.log(`Page visible, reconnecting ${options.table}`)
        setTimeout(() => setupRealtimeSubscription(), 1000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isConnected, isManualDisconnect, setupRealtimeSubscription])

  const subscribe = useCallback(() => {
    setIsManualDisconnect(false)
    setupRealtimeSubscription()
  }, [setupRealtimeSubscription])

  const unsubscribe = useCallback(() => {
    setIsManualDisconnect(true)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setChannel(null)
      setIsConnected(false)
    }
  }, [supabase])

  const reconnect = useCallback(() => {
    setIsManualDisconnect(false)
    setError(null)
    setupRealtimeSubscription()
  }, [setupRealtimeSubscription])

  return {
    data,
    error,
    loading,
    isConnected,
    lastConnected,
    subscribe,
    unsubscribe,
    reconnect,
    channel
  }
}

// Specific hooks
export function useWebsitesRealtime(userId: string, initialData: any[] | null = null) {
  return useSupabaseRealtime(initialData, {
    table: 'websites',
    filter: `user_id=eq.${userId}`,
    event: '*'
  })
}

export function useArticlesRealtime(userId: string, initialData: any[] | null = null) {
  return useSupabaseRealtime(initialData, {
    table: 'articles',
    filter: `user_id=eq.${userId}`,
    event: '*'
  })
}

export function useWebhooksRealtime(userId: string, initialData: any[] | null = null) {
  return useSupabaseRealtime(initialData, {
    table: 'webhooks',
    filter: `user_id=eq.${userId}`,
    event: '*'
  })
}

export function useWorkflowsRealtime(userId: string, initialData: any[] | null = null) {
  return useSupabaseRealtime(initialData, {
    table: 'workflows',
    filter: `user_id=eq.${userId}`,
    event: '*'
  })
}

export function useAIPromptsRealtime(userId: string, initialData: any[] | null = null) {
  return useSupabaseRealtime(initialData, {
    table: 'ai_prompts',
    filter: `user_id=eq.${userId}`,
    event: '*'
  })
}

export function usePublishedArticlesRealtime(userId: string, initialData: any[] | null = null) {
  return useSupabaseRealtime(initialData, {
    table: 'published_articles',
    filter: `user_id=eq.${userId}`,
    event: '*'
  })
}