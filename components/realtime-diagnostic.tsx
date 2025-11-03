"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { IconWifi, IconWifiOff, IconRefresh, IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'

export function RealtimeDiagnostic() {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>({})

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const icon = type === 'success' ? '' : type === 'error' ? '' : type === 'warning' ? '⚠️' : 'ℹ️'
    setLogs(prev => [...prev, `[${timestamp}] ${icon} ${message}`])
  }

  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          addLog(`User authenticated: ${user.id}`, 'success')
        } else {
          addLog('No authenticated user found', 'error')
        }
      } catch (error) {
        addLog(`Error getting user: ${error}`, 'error')
      }
    }
    getUserId()
  }, [])

  const runDiagnostic = async () => {
    setLogs([])
    addLog('Starting realtime diagnostic...', 'info')

    try {
      const supabase = createClient()

      // Test 1: Check Supabase connection
      addLog('Testing Supabase connection...', 'info')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        addLog(' Supabase connection successful', 'success')
      } else {
        addLog(' No active session', 'error')
        return
      }

      // Test 2: Check if user exists in database
      addLog('Checking user data...', 'info')
      const { data: userData, error: userError } = await supabase
        .from('websites')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (!userError && userData) {
        addLog(' User data found in database', 'success')
      } else {
        addLog('⚠️ No user data found (might be normal for new users)', 'warning')
      }

      // Test 3: Test basic realtime subscription
      addLog('Testing realtime subscription...', 'info')
      const channelName = `test-diagnostic-${Date.now()}`

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'websites',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            addLog(`📨 Realtime event received: ${payload.eventType}`, 'success')
            setTestResults(prev => ({ ...prev, realtimeEvent: payload }))
          }
        )
        .subscribe((status) => {
          addLog(`📡 Subscription status: ${status}`, status === 'SUBSCRIBED' ? 'success' : 'warning')
          setIsConnected(status === 'SUBSCRIBED')
          setTestResults(prev => ({ ...prev, subscriptionStatus: status }))
        })

      // Test 4: Wait a moment then test update
      setTimeout(async () => {
        if (isConnected && userId) {
          addLog('Testing database update to trigger realtime...', 'info')

          // Try to update an existing record or insert a test one
          const { data: existingRecord } = await supabase
            .from('websites')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .single()

          if (existingRecord) {
            // Update existing record
            const { error } = await supabase
              .from('websites')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', existingRecord.id)

            if (!error) {
              addLog(' Database update sent, waiting for realtime event...', 'info')
            } else {
              addLog(` Database update failed: ${error.message}`, 'error')
            }
          } else {
            addLog('⚠️ No websites found to test with. Create a website first.', 'warning')
          }

          // Cleanup after 5 seconds
          setTimeout(() => {
            supabase.removeChannel(channel)
            addLog('🔌 Test subscription closed', 'info')
          }, 5000)
        }
      }, 2000)

    } catch (error: any) {
      addLog(` Diagnostic failed: ${error.message}`, 'error')
    }
  }

  const checkEnvironment = () => {
    addLog('Checking environment variables...', 'info')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl) {
      addLog(` Supabase URL: ${supabaseUrl}`, 'success')
    } else {
      addLog(' NEXT_PUBLIC_SUPABASE_URL not found', 'error')
    }

    if (supabaseKey) {
      addLog(` Supabase Anon Key: ${supabaseKey.substring(0, 10)}...`, 'success')
    } else {
      addLog(' NEXT_PUBLIC_SUPABASE_ANON_KEY not found', 'error')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <IconWifi className="h-5 w-5 text-green-500" />
                  Realtime Diagnostic
                </>
              ) : (
                <>
                  <IconWifiOff className="h-5 w-5 text-red-500" />
                  Realtime Diagnostic
                </>
              )}
            </CardTitle>
            <CardDescription>
              Troubleshoot realtime connection issues
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostic} disabled={!userId}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Run Diagnostic
          </Button>
          <Button variant="outline" onClick={checkEnvironment}>
            <IconAlertTriangle className="h-4 w-4 mr-2" />
            Check Environment
          </Button>
        </div>

        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Diagnostic Logs:</h4>
            <Textarea
              value={logs.join('\n')}
              readOnly
              className="h-48 font-mono text-xs"
              placeholder="Diagnostic logs will appear here..."
            />
          </div>
        )}

        {testResults.subscriptionStatus && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Test Results:</h4>
            <div className="text-xs space-y-1">
              <div>Subscription Status: <Badge variant="outline">{testResults.subscriptionStatus}</Badge></div>
              {testResults.realtimeEvent && (
                <div>
                  Last Event: <Badge variant="outline">{testResults.realtimeEvent.eventType}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Common issues:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Migration not applied: Run <code>npx supabase db push</code></li>
            <li>RLS policies blocking access: Check database policies</li>
            <li>No user data: Create at least one website/article first</li>
            <li>Network issues: Check internet connection and firewall</li>
            <li>Supabase project settings: Ensure Realtime is enabled</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}