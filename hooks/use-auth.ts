"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar: string;
  timezone: string;
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session first
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User is logged in, get user data from auth
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url || '',
          timezone: session.user.user_metadata?.timezone || 'UTC'
        };

        setUser(userData);
      } else {
        // No user session
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError((err as Error).message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
      // Clear any local storage if used
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_name');
      // Clear redirect URL on logout
      sessionStorage.removeItem('redirectAfterLogin');
      router.push("/login");
    } catch (err) {
      console.error('Logout error:', err);
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth changes with real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);

      if (event === 'SIGNED_IN' && session?.user) {
        // User just signed in
        fetchUser();

        // Show success notification
        if (typeof window !== 'undefined') {
          // You can add toast notification here if needed
        }
      } else if (event === 'SIGNED_OUT') {
        // User just signed out
        setUser(null);
        setLoading(false);

        // Show logout notification
        if (typeof window !== 'undefined') {
          // You can add toast notification here if needed
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed, user is still logged in
        // You might want to fetch fresh user data
        if (session?.user) {
          fetchUser();
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    signOut,
    refresh: fetchUser,
    isAuthenticated: !!user
  };
};
