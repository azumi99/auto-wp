"use client"

import * as React from "react"
import { IconLoader2, IconBrandGoogle } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn, signUp, resetPassword, resendConfirmationEmail } from "@/lib/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setIsLoading(true)
      // Use the API route for login which handles session cookies properly
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's an email not confirmed error
        if (data.error.includes('Email not confirmed') || data.error.includes('email not confirmed')) {
          throw new Error('Email not confirmed. Please check your inbox for a confirmation email.')
        }
        throw new Error(data.error || 'Login failed')
      }

      toast.success("Logged in successfully")

      // Force a refresh to update the client-side auth state
      router.refresh()
      
      // Redirect to dashboard or stored redirect URL
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
      if (redirectUrl && redirectUrl !== '/login') {
        sessionStorage.removeItem('redirectAfterLogin')
        router.push(redirectUrl)
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error("Login error:", error)
      // Check if it's an email not confirmed error
      if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
        toast.error("Please check your email for a confirmation link before logging in.", {
          action: {
            label: "Resend Email",
            onClick: () => handleResendConfirmation()
          }
        })
      } else {
        toast.error(error.message || "Failed to login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address")
      return
    }

    try {
      setIsLoading(true)
      await resendConfirmationEmail(formData.email)
      toast.success("Confirmation email sent. Please check your inbox.")
    } catch (error: any) {
      console.error("Resend confirmation error:", error)
      toast.error(error.message || "Failed to resend confirmation email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    toast.info("Google login coming soon")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <IconBrandGoogle className="mr-2 h-4 w-4" />
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a href="/auth/register" className="underline">
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}