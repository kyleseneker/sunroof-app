'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex flex-col items-center justify-center p-8 text-center safe-top safe-bottom">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 mx-auto">
          <WifiOff className="w-10 h-10 text-white/60" />
        </div>
        <h1 className="text-2xl font-light mb-3 text-white">You&apos;re offline</h1>
        <p className="text-white/50 max-w-xs mb-8 mx-auto">
          Check your internet connection and try again.
        </p>
        
        <button
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

