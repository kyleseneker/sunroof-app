'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib';

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
      <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex flex-col items-center justify-center p-8 text-center safe-top safe-bottom">
        {/* Ambient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6 mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-medium mb-2 text-white">Sign in failed</h1>
          <p className="text-white/50 mb-6 max-w-xs">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex flex-col items-center justify-center safe-top safe-bottom">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin mb-4" />
        <p className="text-white/50">Signing you in...</p>
      </div>
    </div>
  );
}
