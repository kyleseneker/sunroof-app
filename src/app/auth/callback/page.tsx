'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (errorParam) {
          setError(errorDescription || errorParam);
          return;
        }

        // For OAuth, Supabase uses hash fragments
        // The supabase client automatically picks up the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (session) {
          // Successfully authenticated - redirect to dashboard
          router.replace('/');
        } else {
          // No session yet - might be processing, wait a bit and check again
          // This handles the case where the hash fragment hasn't been processed yet
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            router.replace('/');
          } else {
            // Still no session - redirect to login
            router.replace('/login');
          }
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-medium mb-2">Sign in failed</h1>
        <p className="text-zinc-500 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => router.replace('/login')}
          className="px-6 py-3 bg-white text-black rounded-full font-medium"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-4" />
      <p className="text-zinc-400">Signing you in...</p>
    </div>
  );
}
