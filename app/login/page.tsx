import { LoginForm } from "@/components/login-form"
import { createClient } from "@/lib/supabaseServices"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabaseServices"

export default async function Page({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Check if user is already authenticated
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

  const error = searchParams.error
  let errorMessage = ""

  if (error === 'email-not-confirmed') {
    errorMessage = "Please confirm your email address before logging in. Check your inbox for a confirmation email."
  } else if (error === 'auth-code-error') {
    errorMessage = "There was an error processing your authentication. Please try logging in again."
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
