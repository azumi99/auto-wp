"use client"

import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [loading, isAuthenticated, router])

  const error = searchParams?.get('error')
  let errorMessage = ""

  if (error === 'email-not-confirmed') {
    errorMessage = "Please confirm your email address before logging in. Check your inbox for a confirmation email."
  } else if (error === 'auth-code-error') {
    errorMessage = "There was an error processing your authentication. Please try logging in again."
  }

  // Show loading or null while checking auth status
  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/15 text-destructive rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  )
}
