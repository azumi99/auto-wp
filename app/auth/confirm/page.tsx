"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconLoader2 } from '@tabler/icons-react';

export default function ConfirmPage() {
  const router = useRouter();
  
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        // If session exists, redirect to dashboard
        router.push('/dashboard');
      } else {
        // If no session, user might need to log in or confirm email
        router.push('/login');
      }
    };
    
    checkSession();
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Confirming your email</CardTitle>
          <CardDescription>
            Please wait while we verify your email confirmation...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button disabled>
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}