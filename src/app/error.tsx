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
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-red-500/10 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-light mb-3 text-white">Something went wrong</h1>
        <p className="text-zinc-500 max-w-xs mb-8 mx-auto">
          We encountered an unexpected error. Please try again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-100 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all border border-zinc-800"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-zinc-900 rounded-lg text-left max-w-lg mx-auto">
            <p className="text-xs text-zinc-500 mb-2">Error details (dev only):</p>
            <pre className="text-xs text-red-400 overflow-auto">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-zinc-600 mt-2">Digest: {error.digest}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

