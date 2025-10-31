# System Logs Setup Guide

## Quick Setup (Recommended)

### Method 1: Auto-Generate SQL

1. Run this API to get the SQL:
```bash
curl -X POST http://localhost:3000/api/init-system-logs
```

2. Copy the SQL from the response

3. Go to **Supabase Dashboard** → **SQL Editor**

4. Paste and execute the SQL

5. Test by visiting: `http://localhost:3000/dashboard/logs`

### Method 2: Manual Setup

1. **Go to Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this SQL:**

```sql
-- Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    user_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);

-- Insert test log
INSERT INTO public.system_logs (level, message, source, metadata)
VALUES ('info', 'System logs table initialized successfully', 'setup', '{"auto": true}')
ON CONFLICT DO NOTHING;
```

## Features Available

### After Setup:
- ✅ Real-time log monitoring at `/dashboard/logs`
- ✅ Filter by level (info/warn/error/debug)
- ✅ Filter by source (scheduler/webhooks/articles)
- ✅ Time range filtering
- ✅ Search functionality
- ✅ Auto-refresh every 30 seconds
- ✅ Statistics dashboard

### Before Setup (Fallback):
- ✅ System works with test logs automatically
- ✅ All features available for testing
- ⚠️ Logs are in-memory only (reset on server restart)

## Using the Logger

```typescript
import { logger } from '@/lib/logger'

// Log article activities
await logger.articleAction('created', articleId, userId)
await logger.articleAction('processed', articleId, userId, { title: 'Article Title' })

// Log webhook activities
await logger.webhookAction('triggered', webhookId, webhookUrl)
await logger.webhookAction('failed', webhookId, webhookUrl, { error: 'Timeout' })

// Log scheduler activities
await logger.schedulerAction('started', { count: 5 })
await logger.schedulerAction('completed', { success: 4, failed: 1 })

// Log errors
await logger.error('Processing failed', 'scheduler', { articleId }, { error: 'Database error' })

// Log general info
await logger.info('User logged in', 'auth', { userId })
```

## API Endpoints

- `GET/POST /api/system-logs` - Main system logs API
- `GET/POST /api/test-logs` - Test logs (fallback)
- `POST /api/init-system-logs` - Generate setup SQL

## Troubleshooting

### Error: "System logs table not found"
- The database table hasn't been created yet
- Follow the setup steps above
- System will automatically use test logs as fallback

### Error: "invalid privilege type USAGE for table"
- Fixed in the latest migration
- Use the simplified SQL from Method 1 above

### Import Errors
- Make sure logger is imported from `@/lib/logger`
- Check file paths are correct

## Monitoring Dashboard Access

Visit: `http://localhost:3000/dashboard/logs`

Features:
- Real-time monitoring
- Statistics overview
- Advanced filtering
- Search functionality
- Auto-refresh option