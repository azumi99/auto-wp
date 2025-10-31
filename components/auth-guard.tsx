"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconLock, IconLogin } from "@tabler/icons-react";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  fallbackPath = "",
  redirectTo
}: AuthGuardProps) {
  const { user, loading, error, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and user is not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      // Store the attempted URL for redirect after login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
      }

      const redirectUrl = redirectTo || fallbackPath;
      router.push(redirectUrl);
      return;
    }
  }, [loading, isAuthenticated, router, fallbackPath, redirectTo]);

  // Don't show any special UI during loading state to prevent flickering
  // The redirect will still happen via useEffect
  if (loading) {
    // Render children immediately while checking authentication in the background
    // This prevents the flickering but still allows for proper redirect if not authenticated
    return <>{children}</>;
  }

  // Show error state if authentication check failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <IconLock className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-lg text-red-600">Error Autentikasi</CardTitle>
            <CardDescription className="text-red-500">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="outline"
            >
              Coba Lagi
            </Button>
            <Link href="/login" className="w-full">
              <Button className="w-full">
                <IconLogin className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not authenticated, show auth required UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <IconLock className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-lg">Autentikasi Diperlukan</CardTitle>
            <CardDescription>
              Anda harus login untuk mengakses halaman ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="w-full">
              <Button className="w-full">
                <IconLogin className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

// Higher-Order Component for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  fallbackPath?: string
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard fallbackPath={fallbackPath}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}