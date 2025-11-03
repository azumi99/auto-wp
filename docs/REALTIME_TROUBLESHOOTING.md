# Realtime CRUD Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: Status Shows "Offline" 

**Symptoms:**
- Realtime status badge shows "Offline" instead of "Live"
- No automatic updates when data changes
- Browser console shows connection errors

**Causes & Solutions:**

#### 1. Database Migration Not Applied
```bash
# Run the migration to enable realtime
npx supabase db push

# Or if you need to reset
npx supabase db reset
npx supabase db push
```

#### 2. No Data in Tables
Realtime subscriptions need existing data to work properly.
- Create at least 1 website in `/websites`
- Create at least 1 article in `/articles`
- Realtime will connect when there's data to subscribe to

#### 3. Supabase Project Settings
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **API**
3. Ensure **Realtime** is enabled
4. Check that your API keys are correct

#### 4. Environment Variables
Check your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Issue 2: Updates Require Page Refresh 🔄

**Symptoms:**
- Realtime shows "Connected" but updates don't appear
- Need to manually refresh the page to see changes
- Other browser tabs don't update automatically

**Solutions:**

#### 1. Check Browser Console
Open browser dev tools (F12) and check for:
- Console errors
- Network connection issues
- Authentication problems

#### 2. Verify RLS Policies
Row Level Security policies must allow realtime access:
```sql
-- This should be in your migration
CREATE POLICY "Users can listen to their own websites changes" ON websites
FOR SELECT USING (auth.uid() = user_id);
```

#### 3. Test with Diagnostic Tool
1. Go to `/dashboard`
2. Find the "Realtime Diagnostic" section
3. Click "Run Diagnostic"
4. Check the detailed logs for specific errors

### Issue 3: Authentication Problems 🔐

**Symptoms:**
- "User not authenticated" errors
- No realtime events for user-specific data
- Offline status with authentication errors

**Solutions:**

#### 1. Check User Session
```javascript
// In browser console
localStorage.getItem('supabase.auth.token')
```

#### 2. Re-authenticate
- Log out and log back in
- Clear browser cache and localStorage
- Ensure user session is valid

### Issue 4: Multiple Browser Tabs Don't Sync 📱

**Symptoms:**
- Updates work on one tab but not others
- Only the active tab receives updates
- Inconsistent behavior across tabs

**Solutions:**

#### 1. Test Properly
1. Open the same page (e.g., `/websites`) in 2+ tabs
2. Make changes in one tab
3. Watch for automatic updates in other tabs
4. Check browser console in all tabs

#### 2. Check Connection Limits
Supabase has connection limits per project:
- Too many tabs can hit connection limits
- Implement connection cleanup when tabs are closed

## 🔧 Step-by-Step Fix Guide

### Step 1: Run Setup Script
```bash
# Make script executable (on Unix-like systems)
chmod +x scripts/setup-realtime.sh

# Run the setup
./scripts/setup-realtime.sh
```

### Step 2: Verify Database Setup
```bash
# Check if realtime is enabled
npx tsx scripts/check-realtime-setup.ts
```

### Step 3: Test with Data
1. Create a test website
2. Open `/websites` in 2 browser tabs
3. Edit the website in one tab
4. Verify it updates automatically in the other tab

### Step 4: Check Browser Console
Look for these specific console messages:
```
 Successfully subscribed to websites realtime updates
📨 Realtime update received for websites: {...}
Websites updated via realtime: 1 items
```

## 🐛 Debug Mode

Enable debug logging by checking browser console for detailed logs:
- Realtime subscription status
- Event details
- Connection state changes
- Error messages

## 📞 Getting Help

If issues persist:

1. **Check Diagnostic Tool**: Use the built-in diagnostic in `/dashboard`
2. **Browser Console**: Check for specific error messages
3. **Network Tab**: Verify WebSocket connections to Supabase
4. **Supabase Dashboard**: Check project logs and settings

## 🧪 Test Cases

### Test Case 1: Basic CRUD
- [ ] Create website → Appears in all tabs instantly
- [ ] Edit website → Updates in all tabs instantly
- [ ] Delete website → Removes from all tabs instantly

### Test Case 2: Multiple Tables
- [ ] Website changes update instantly
- [ ] Article changes update instantly
- [ ] Webhook changes update instantly

### Test Case 3: Cross-Browser
- [ ] Changes in Chrome appear in Firefox
- [ ] Changes in Safari appear in Chrome
- [ ] Mobile and desktop stay in sync

## 🎯 Quick Fix Checklist

- [ ] Migration applied (`npx supabase db push`)
- [ ] Environment variables set correctly
- [ ] At least 1 record exists in each table
- [ ] User is authenticated
- [ ] No browser console errors
- [ ] WebSocket connection established
- [ ] RLS policies allow realtime access
- [ ] Supabase project has Realtime enabled

If all these are checked , realtime should work properly!