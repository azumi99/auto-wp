'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useArticlesRealtime, useWebsitesRealtime, useWebhooksRealtime, useWorkflowsRealtime, usePublishedArticlesRealtime } from '@/hooks/use-supabase-realtime'
import { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeContextType {
  isConnected: boolean
  connectionError: Error | null
  articles: any[] | null
  websites: any[] | null
  webhooks: any[] | null
  workflows: any[] | null
  publishedArticles: any[] | null
  subscribeToTable: (table: string, userId: string, callback: (payload: any) => void) => RealtimeChannel | null
  unsubscribeFromTable: (channel: RealtimeChannel) => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

interface RealtimeProviderProps {
  children: ReactNode
  userId: string
  initialData?: {
    articles?: any[]
    websites?: any[]
    webhooks?: any[]
    workflows?: any[]
    publishedArticles?: any[]
  }
}

export function RealtimeProvider({ children, userId, initialData }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const supabase = createClient()

  // Realtime subscriptions for different tables
  const {
    data: articles,
    error: articlesError,
    loading: articlesLoading,
    subscribe: subscribeArticles
  } = useArticlesRealtime(userId, initialData?.articles || null)

  const {
    data: websites,
    error: websitesError,
    loading: websitesLoading,
    subscribe: subscribeWebsites
  } = useWebsitesRealtime(userId, initialData?.websites || null)

  const {
    data: webhooks,
    error: webhooksError,
    loading: webhooksLoading,
    subscribe: subscribeWebhooks
  } = useWebhooksRealtime(userId, initialData?.webhooks || null)

  const {
    data: workflows,
    error: workflowsError,
    loading: workflowsLoading,
    subscribe: subscribeWorkflows
  } = useWorkflowsRealtime(userId, initialData?.workflows || null)

  const {
    data: publishedArticles,
    error: publishedArticlesError,
    loading: publishedArticlesLoading,
    subscribe: subscribePublishedArticles
  } = usePublishedArticlesRealtime(userId, initialData?.publishedArticles || null)

  // Subscribe to all tables on mount
  useEffect(() => {
    if (userId) {
      subscribeArticles()
      subscribeWebsites()
      subscribeWebhooks()
      subscribeWorkflows()
      subscribePublishedArticles()
    }
  }, [userId, subscribeArticles, subscribeWebsites, subscribeWebhooks, subscribeWorkflows, subscribePublishedArticles])

  // Monitor connection status
  useEffect(() => {
    const anyLoading = articlesLoading || websitesLoading || webhooksLoading || workflowsLoading || publishedArticlesLoading
    const anyError = articlesError || websitesError || webhooksError || workflowsError || publishedArticlesError

    setIsConnected(!anyLoading && !anyError)
    setConnectionError(anyError)
  }, [articlesLoading, websitesLoading, webhooksLoading, workflowsLoading, publishedArticlesLoading, articlesError, websitesError, webhooksError, workflowsError, publishedArticlesError])

  // Generic subscription function for custom tables
  const subscribeToTable = (table: string, userId: string, callback: (payload: any) => void) => {
    const channelName = `${table}-${userId}-${Date.now()}`

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
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${table} for user ${userId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to ${table}`)
        }
      })

    return channel
  }

  const unsubscribeFromTable = (channel: RealtimeChannel) => {
    supabase.removeChannel(channel)
  }

  const value: RealtimeContextType = {
    isConnected,
    connectionError,
    articles,
    websites,
    webhooks,
    workflows,
    publishedArticles,
    subscribeToTable,
    unsubscribeFromTable
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Specific hooks for different data types
export function useRealtimeArticles() {
  const { articles, isConnected, connectionError } = useRealtime()
  return { articles, isConnected, connectionError }
}

export function useRealtimeWebsites() {
  const { websites, isConnected, connectionError } = useRealtime()
  return { websites, isConnected, connectionError }
}

export function useRealtimeWebhooks() {
  const { webhooks, isConnected, connectionError } = useRealtime()
  return { webhooks, isConnected, connectionError }
}

export function useRealtimeWorkflows() {
  const { workflows, isConnected, connectionError } = useRealtime()
  return { workflows, isConnected, connectionError }
}

export function useRealtimePublishedArticles() {
  const { publishedArticles, isConnected, connectionError } = useRealtime()
  return { publishedArticles, isConnected, connectionError }
}