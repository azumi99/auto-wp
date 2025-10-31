'use client'

import React from 'react'
import { SystemLogMonitor } from '@/components/system-log-monitor'
import MainLayout from '@/app/main'

export default function SystemLogsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-gray-600 mt-2">
            Monitor all system activities, errors, and events in real-time
          </p>
        </div>
        <SystemLogMonitor />
      </div>
    </MainLayout>
  )
}