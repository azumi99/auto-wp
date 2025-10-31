# Supabase Realtime Implementation Guide

This guide explains how to use the newly implemented Supabase realtime functionality in your WordPress automation project.

## Overview

The project now supports real-time updates for all CRUD operations across:
- Articles
- Websites
- Webhooks
- Workflows
- Published Articles
- System Logs

## What Was Implemented

### 1. Enhanced Supabase Client (`lib/supabaseClient.ts`)
- Added realtime configuration with eventsPerSecond limit
- Optimized for real-time subscriptions

### 2. Realtime Hooks (`hooks/use-supabase-realtime.ts`)
- Generic `useSupabaseRealtime` hook for any table
- Specific hooks for each table type:
  - `useArticlesRealtime(userId, initialData)`
  - `useWebsitesRealtime(userId, initialData)`
  - `useWebhooksRealtime(userId, initialData)`
  - `useWorkflowsRealtime(userId, initialData)`
  - `usePublishedArticlesRealtime(userId, initialData)`
  - `useSystemLogsRealtime(initialData)`

### 3. Realtime Provider (`components/realtime-provider.tsx`)
- Context provider for global realtime state
- Manages subscriptions for all tables
- Provides connection status monitoring
- Custom subscription support for any table

### 4. Enhanced Components
- **Article Progress Tracker**: Now uses realtime instead of polling
- **Realtime Dashboard**: Comprehensive monitoring dashboard
- **Realtime Articles Page**: Example implementation with toggle functionality

### 5. Realtime Actions (`src/lib/realtime/actions.ts`)
- Server-side utilities for realtime-aware operations
- Automatic logging and revalidation
- Permission validation
- CRUD helper class with realtime support

## How to Use

### Basic Usage with Hooks

```typescript
'use client'

import { useArticlesRealtime } from '@/hooks/use-supabase-realtime'
import { useCurrentUser } from '@/hooks/use-auth'

function MyComponent() {
  const { user } = useCurrentUser()
  const {
    data: articles,
    error,
    loading,
    subscribe,
    unsubscribe
  } = useArticlesRealtime(user?.id || '')

  // Articles will update automatically when database changes occur
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Articles ({articles?.length || 0})</h2>
      {articles?.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  )
}
```

### Using the Realtime Provider

```typescript
'use client'

import { RealtimeProvider, useRealtimeArticles } from '@/components/realtime-provider'

function AppContent() {
  const { user } = useCurrentUser()
  const { articles, isConnected } = useRealtimeArticles()

  return (
    <div>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Articles: {articles?.length || 0}</div>
    </div>
  )
}

function App() {
  const { user } = useCurrentUser()

  if (!user) return <div>Please log in</div>

  return (
    <RealtimeProvider
      userId={user.id}
      initialData={{
        articles: [], // Optional initial data
        websites: [],
        webhooks: [],
        workflows: []
      }}
    >
      <AppContent />
    </RealtimeProvider>
  )
}
```

### Server-Side Realtime Actions

```typescript
import { createRealtimeCRUD } from '@/src/lib/realtime/actions'

// Server Action
export async function updateArticleStatus(articleId: string, status: string) {
  const crud = createRealtimeCRUD('articles', userId)

  return await crud.updateStatus(articleId, status, {
    updated_at: new Date().toISOString(),
    // Additional metadata
  })
}

// Create new record
export async function createWebsite(data: any) {
  const crud = createRealtimeCRUD('websites', userId)

  return await crud.create(data, {
    revalidatePaths: ['/websites', '/dashboard']
  })
}
```

## Updated Components

### 1. Article Progress Tracker
- Now uses `useArticlesRealtime` hook
- Shows connection status (Connected/Disconnected/Error)
- Can pause/resume realtime updates
- Automatic updates when article status changes

**Usage:**
```tsx
<ArticleProgressTracker
  articles={scheduledArticles}
  userId={user.id}
  onRefresh={() => {/* Optional manual refresh */}}
/>
```

### 2. Realtime Dashboard
- Live statistics for all tables
- Connection status monitoring
- Detailed connection information
- Article status breakdown

**Usage:**
```tsx
<RealtimeDashboard userId={user.id} />
```

### 3. Enhanced Articles Page
- Toggle between realtime and manual refresh
- Live connection status indicator
- Automatic updates when enabled
- Fallback to manual refresh when realtime is disabled

## Migration from Polling to Realtime

### Before (Polling):
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadArticles() // API call every 30 seconds
  }, 30000)
  return () => clearInterval(interval)
}, [])
```

### After (Realtime):
```typescript
const { data: articles, error, loading } = useArticlesRealtime(userId)
// Articles update automatically when database changes occur
```

## Connection Status Monitoring

Realtime hooks provide connection status information:

```typescript
const {
  data,
  error,           // Connection error if any
  loading,         // True while connecting
  isConnected      // Connection status
} = useArticlesRealtime(userId)
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Connection Errors**: Displayed in UI with retry options
2. **Permission Errors**: Validates user access before operations
3. **Network Issues**: Automatic reconnection attempts
4. **Fallback Support**: Falls back to manual refresh if realtime fails

## Performance Considerations

1. **Event Throttling**: Configured to 10 events per second
2. **User Filtering**: Only subscribes to user-specific data
3. **Automatic Cleanup**: Unsubscribes when components unmount
4. **Connection Pooling**: Efficient connection management

## Security

1. **RLS Policies**: All realtime updates respect Row Level Security
2. **User Validation**: Server actions validate user permissions
3. **Scoped Subscriptions**: Users only receive their own data updates

## Testing Realtime Functionality

To test the realtime functionality:

1. **Open two browser windows** with the same user account
2. **Make changes** in one window (create/update/delete articles)
3. **Observe updates** in the other window without manual refresh
4. **Check connection status** indicators
5. **Test error scenarios** by disconnecting network

## Files Modified/Created

### New Files:
- `hooks/use-supabase-realtime.ts` - Core realtime hooks
- `components/realtime-provider.tsx` - Global realtime context
- `src/lib/realtime/actions.ts` - Server-side realtime utilities
- `components/realtime-dashboard.tsx` - Monitoring dashboard
- `src/screens/articles/realtime-page.tsx` - Example realtime page
- `docs/REALTIME_IMPLEMENTATION_GUIDE.md` - This documentation

### Modified Files:
- `lib/supabaseClient.ts` - Added realtime configuration
- `components/article-progress-tracker.tsx` - Realtime integration

## Next Steps

1. **Replace existing polling logic** with realtime hooks
2. **Add realtime to other pages** (websites, webhooks, workflows)
3. **Implement custom subscriptions** for complex business logic
4. **Add analytics** for realtime connection performance
5. **Monitor usage** and optimize as needed

## Troubleshooting

### Common Issues:

1. **Realtime not working:**
   - Check Supabase project settings have realtime enabled
   - Verify RLS policies allow realtime subscriptions
   - Check browser console for connection errors

2. **Permission errors:**
   - Ensure user is authenticated
   - Check RLS policies include realtime access
   - Verify user_id matches in subscription filters

3. **Performance issues:**
   - Monitor number of concurrent subscriptions
   - Check database query performance
   - Consider event throttling settings

4. **Connection drops:**
   - Implement retry logic
   - Show connection status to users
   - Provide fallback refresh options