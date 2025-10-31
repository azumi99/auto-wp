# Webhook Payload & Scheduler Fixes Applied

## ✅ Issues Fixed

### 1. **Username & Password WordPress Kosong**
- **Root Cause**: Query database tidak mengambil `wp_username` dan `wp_password` dari tabel `websites`
- **Solution**: Update query di semua file untuk include: `websites(name, url, wp_username, wp_password)`

### 2. **Format Payload Webhook Tidak Sesuai**
- **Root Cause**: Ada 2 scheduler yang berjalan dengan format berbeda:
  - **Article Scheduler (lama)**: Format tanpa `body` wrapper
  - **Workflow Scheduler (baru)**: Format dengan `body` wrapper
- **Solution**: Disable article scheduler, gunakan hanya workflow scheduler

### 3. **Scheduler Tidak Berjalan Otomatis**
- **Root Cause**: Scheduler tidak di-auto-start saat aplikasi dimulai
- **Solution**: Middleware auto-initialization dan daemon process untuk monitoring

## 📋 Files Modified

### Core Scheduler Files:
1. `src/lib/articles/scheduled-articles.ts` - ✅ Fixed query & payload format
2. `src/lib/articles/scheduled-articles-workflow.ts` - ✅ Already correct
3. `app/api/force-process/route.ts` - ✅ Updated with credentials
4. `src/middleware.ts` - ✅ Auto-start workflow scheduler
5. `src/lib/scheduler/init.ts` - ❌ Disabled article scheduler
6. `src/lib/scheduler/workflow-auto-start.ts` - ✅ Auto-start module

### New Files Added:
1. `app/api/scheduler/auto-start/route.ts` - ✅ Auto-start API
2. `scripts/scheduler-daemon.js` - ✅ Background daemon
3. `scripts/check-website-credentials.js` - ✅ Credential checker

## 🎯 Expected Webhook Payload Format

**Workflow Scheduler (Active):**
```json
{
  "body": {
    "topic": "Lambang negara indonesia",
    "website_id": "0292df57-8e50-4ab8-8da7-daa0864bac65",
    "article_id": "7ef2fcb1-3b7f-444a-b433-dd63409452fc",
    "trigger_type": "scheduled_publication",
    "user_id": "3411753e-0cdf-4d1f-a9ee-40ee9be2086b",
    "scheduled_at": "2025-10-21T19:59:00+07:00",
    "metadata": {
      "website_name": "allindonesian",
      "website_url": "http://wp/",
      "website_username": "your_actual_username",
      "website_password": "your_actual_password",
      "webhook_name": "n8nv1",
      "webhook_id": "98394e87-3431-4036-bae4-1fff09fc3f11",
      "generation_type": "scheduled",
      "processed_at": "2025-10-21T13:00:02.965Z"
    }
  }
}
```

## 🔧 Action Required

### 1. **Check Website Credentials**
```bash
# Check if credentials are properly stored
node scripts/check-website-credentials.js check

# If credentials are empty, update them in the admin panel:
# 1. Go to /websites
# 2. Edit each website
# 3. Fill WordPress Username & Password
# 4. Save changes
```

### 2. **Restart Application**
```bash
# Stop current process (Ctrl+C)
# Then restart:
npm run dev
```

### 3. **Verify Active Scheduler**
```bash
# Check scheduler status
curl http://localhost:3000/api/scheduler/workflow

# Should show workflow scheduler is running
```

### 4. **Production Deployment**
```bash
# Build and deploy
npm run build
npm start

# Start daemon in background
NODE_ENV=production node scripts/scheduler-daemon.js daemon &

# Or use PM2
pm2 start scripts/scheduler-daemon.js --name scheduler-daemon -- daemon
```

## 🚨 Important Notes

1. **Only Workflow Scheduler is Active**: Article scheduler has been disabled to prevent conflicts
2. **Auto-Start**: Scheduler automatically starts when first request hits the middleware
3. **Credentials Must Be Set**: Empty username/password will show warnings in logs
4. **Monitor Logs**: Check console for credential warnings and scheduler status

## 📊 Monitoring

### Check Scheduler Status:
- **API**: `GET /api/scheduler/workflow`
- **Auto-start**: `GET /api/scheduler/auto-start`
- **Health**: `GET /api/health`

### Manual Commands:
```bash
# Start scheduler manually
node scripts/scheduler-daemon.js start

# Check health
node scripts/scheduler-daemon.js health

# Run as daemon (continuous monitoring)
node scripts/scheduler-daemon.js daemon
```

## ✅ Verification

After applying fixes:

1. ✅ Webhook payload includes `website_username` and `website_password`
2. ✅ Payload format uses `body` wrapper consistently
3. ✅ Only workflow scheduler runs (no duplicates)
4. ✅ Scheduler auto-starts without manual intervention
5. ✅ Credentials are validated and warnings shown if empty

The system should now send complete webhook payloads with WordPress credentials to n8n!