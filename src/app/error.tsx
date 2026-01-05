'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex flex-col items-center justify-center p-8 text-center safe-top safe-bottom">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-light mb-3 text-white">Something went wrong</h1>
        <p className="text-white/50 max-w-xs mb-8 mx-auto">
          We encountered an unexpected error. Please try again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/20 active:scale-[0.98] transition-all border border-white/20"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl text-left max-w-lg mx-auto">
            <p className="text-xs text-white/40 mb-2">Error details (dev only):</p>
            <pre className="text-xs text-red-400 overflow-auto">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-white/30 mt-2">Digest: {error.digest}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

