import MainLayout from "@/app/main";

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and preferences.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* General Settings Card */}
            <div className="rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">General</h3>
                  <p className="text-sm text-muted-foreground">Basic application settings</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Language</span>
                  <span className="text-sm text-muted-foreground">English</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timezone</span>
                  <span className="text-sm text-muted-foreground">UTC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <span className="text-sm text-muted-foreground">System</span>
                </div>
              </div>
            </div>

            {/* Notification Settings Card */}
            <div className="rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">Alert preferences</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email notifications</span>
                  <div className="h-4 w-7 rounded-full bg-blue-600"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push notifications</span>
                  <div className="h-4 w-7 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS alerts</span>
                  <div className="h-4 w-7 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </div>

            {/* Security Settings Card */}
            <div className="rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Security</h3>
                  <p className="text-sm text-muted-foreground">Privacy & security</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-factor auth</span>
                  <span className="text-sm text-muted-foreground">Disabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session timeout</span>
                  <span className="text-sm text-muted-foreground">30 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active sessions</span>
                  <span className="text-sm text-muted-foreground">2</span>
                </div>
              </div>
            </div>

            {/* API Settings Card */}
            <div className="rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">API</h3>
                  <p className="text-sm text-muted-foreground">Integration settings</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API key</span>
                  <span className="text-sm text-muted-foreground">••••••••</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhook URL</span>
                  <span className="text-sm text-muted-foreground">Configured</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate limit</span>
                  <span className="text-sm text-muted-foreground">1000/hr</span>
                </div>
              </div>
            </div>

            {/* Data & Privacy Card */}
            <div className="rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Data & Privacy</h3>
                  <p className="text-sm text-muted-foreground">Data management</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data export</span>
                  <button className="text-sm text-blue-600 hover:underline">Export</button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data backup</span>
                  <span className="text-sm text-muted-foreground">Auto</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Delete account</span>
                  <button className="text-sm text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                  <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Support</h3>
                  <p className="text-sm text-muted-foreground">Help & support</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Documentation</span>
                  <a href="/help" className="text-sm text-blue-600 hover:underline">View</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contact support</span>
                  <button className="text-sm text-blue-600 hover:underline">Contact</button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System status</span>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Backup Data
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Clear Cache
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Regenerate API Key
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                View Activity Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}