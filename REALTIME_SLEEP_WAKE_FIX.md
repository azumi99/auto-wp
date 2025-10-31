# Supabase Realtime Sleep/Wake Fix

## Masalah
Setiap kali laptop sleep dan bangun kembali, muncul error:
```
use-supabase-realtime.ts:156 ❌ Failed to subscribe to articles realtime updates
page.tsx:138 Realtime connection error: Error: Failed to subscribe to articles realtime updates
```

## Root Cause
1. **Stale Connection** - Realtime connection tetap aktif tapi tidak valid setelah sleep
2. **No Reconnection Logic** - Tidak ada mekanisme auto-reconnect saat connection lost
3. **No Sleep/Wake Detection** - Tidak ada deteksi saat laptop sleep/bangun
4. **Channel Error** - `CHANNEL_ERROR` status tidak ditangani dengan baik

## Solusi

### Opsi 1: Gunakan Improved Hook (Recommended)
Gunakan hook yang sudah diperbaiki dengan reconnection logic:

```typescript
// Ganti import dari:
import { useArticlesRealtime } from "@/hooks/use-supabase-realtime"

// Menjadi:
import { useArticlesRealtimeImproved } from "@/hooks/use-supabase-realtime-improved"

// Dan update pemanggilan:
const { data, error, loading, isConnected, reconnect } = useArticlesRealtimeImproved(userId, initialData)
```

### Opsi 2: Patch Existing Hook
Tambahkan reconnection logic ke hook yang ada:

```typescript
// Tambahkan ke state:
const [reconnectAttempts, setReconnectAttempts] = useState(0)
const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

// Tambahkan sleep/wake detection:
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !isConnected) {
      console.log('Page visible, reconnecting...')
      setReconnectAttempts(0)
      // Trigger reconnect logic
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [isConnected])

// Update subscription handler:
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    setIsConnected(true)
    setReconnectAttempts(0)
    setError(null)
  } else if (status === 'CHANNEL_ERROR') {
    setIsConnected(false)
    setError(new Error('Failed to subscribe'))

    // Auto-reconnect logic
    if (reconnectAttempts < 5) {
      setTimeout(() => {
        setReconnectAttempts(prev => prev + 1)
        // Trigger reconnection
      }, 2000 * (reconnectAttempts + 1))
    }
  }
})
```

### Opsi 3: Manual Reconnect Button
Tambahkan tombol reconnect di UI:

```typescript
const { reconnect, isConnected, error } = useArticlesRealtime(userId, initialData)

// Di component:
{error && (
  <div className="flex items-center gap-2 p-3 bg-red-50 rounded">
    <span className="text-sm text-red-600">Connection lost</span>
    <Button
      size="sm"
      onClick={reconnect}
      disabled={isConnected}
    >
      Reconnect
    </Button>
  </div>
)}
```

## File yang Dibuat

1. **`hooks/use-supabase-realtime-improved.ts`** - Hook lengkap dengan:
   - Auto-reconnect dengan exponential backoff
   - Sleep/wake detection
   - Network status monitoring
   - Manual reconnect capability
   - Enhanced error handling

2. **`hooks/realtime-reconnect-patch.ts`** - Patch sederhana untuk existing hook

3. **`hooks/realtime-reconnect-patch.ts`** - Patch untuk ditambahkan ke hook yang ada

## Cara Implementasi

### Step 1: Update Imports
```typescript
// Di semua file yang menggunakan realtime hooks:
import { useArticlesRealtimeImproved } from "@/hooks/use-supabase-realtime-improved"
import { useWebsitesRealtimeImproved } from "@/hooks/use-supabase-realtime-improved"
import { useWebhooksRealtimeImproved } from "@/hooks/use-supabase-realtime-improved"
import { useWorkflowsRealtimeImproved } from "@/hooks/use-supabase-realtime-improved"
```

### Step 2: Update Hook Usage
```typescript
// Contoh di articles page:
const {
  data: articles,
  error: articlesError,
  loading: articlesLoading,
  isConnected,
  reconnect,
  lastConnected
} = useArticlesRealtimeImproved(userId, initialData)
```

### Step 3: Add UI Feedback (Optional)
```typescript
// Tambahkan connection status indicator:
<div className="flex items-center gap-2">
  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
  <span className="text-sm text-muted-foreground">
    {isConnected ? 'Connected' : 'Disconnected'}
  </span>
  {!isConnected && (
    <Button size="sm" onClick={reconnect}>
      Reconnect
    </Button>
  )}
</div>
```

## Features Improved Hook

1. **✅ Auto-Reconnect** - Mencoba reconnect otomatis saat connection lost
2. **✅ Exponential Backoff** - Delay reconnect untuk menghindari spam
3. **✅ Sleep/Wake Detection** - Deteksi saat laptop sleep/bangun
4. **✅ Network Monitoring** - Deteksi saat online/offline
5. **✅ Manual Reconnect** - User bisa trigger reconnect manual
6. **✅ Connection Status** - Informasi detail tentang connection status
7. **✅ Error Recovery** - Robust error handling dan recovery
8. **✅ Max Attempts** - Membatasi jumlah reconnection attempts

## Testing

Untuk testing sleep/wake scenario:

1. Buka aplikasi dengan realtime subscriptions
2. Lakukan sleep pada laptop
3. Bangunkan laptop dan buka kembali aplikasi
4. Hook seharusnya otomatis mencoba reconnect
5. Cek console log untuk reconnect attempts

## Monitoring

Hook improved akan menampilkan log seperti:
```
Setting up realtime subscription for articles with filter: user_id=eq.xxx
Realtime subscription status for articles: SUBSCRIBED
✅ Successfully subscribed to articles realtime updates

// Setelah sleep:
Page became visible, attempting to reconnect to articles
Attempting reconnection 1/3 for articles
Realtime subscription status for articles: SUBSCRIBED
✅ Successfully subscribed to articles realtime updates
```

## Troubleshooting

Jika masih error:
1. **Cek console logs** untuk melihat reconnect attempts
2. **Pastikan Supabase Realtime enabled** di project settings
3. **Cek RLS policies** untuk table yang di-subscribe
4. **Test manual reconnect** dengan tombol reconnect
5. **Cek network connection** saat aplikasi dibuka

## Migration

Untuk migrasi dari hook lama ke improved hook:

1. **Backup** file yang ada
2. **Copy improved hook** ke project
3. **Update imports** di semua file yang menggunakan realtime
4. **Test** di browser dengan sleep/wake scenario
5. **Monitor** console logs untuk memastikan reconnect berjalan

## Conclusion

Dengan improved hook, realtime subscription akan otomatis pulih setelah laptop sleep/bangun, memberikan pengalaman yang lebih baik untuk user.