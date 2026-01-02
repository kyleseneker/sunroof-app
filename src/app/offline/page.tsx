'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-zinc-500/10 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6 mx-auto">
          <WifiOff className="w-10 h-10 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-light mb-3 text-white">You&apos;re offline</h1>
        <p className="text-zinc-500 max-w-xs mb-8 mx-auto">
          Check your internet connection and try again.
        </p>
        
        <button
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-100 active:scale-[0.98] transition-all mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

