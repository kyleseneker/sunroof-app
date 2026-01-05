'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex flex-col items-center justify-center p-8 text-center safe-top safe-bottom">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="text-8xl font-light text-white/20 mb-4">404</div>
        <h1 className="text-2xl font-light mb-3 text-white">Page not found</h1>
        <p className="text-white/50 max-w-xs mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => typeof window !== 'undefined' && window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/20 active:scale-[0.98] transition-all border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

