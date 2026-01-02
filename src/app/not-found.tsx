'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-orange-500/10 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="text-8xl font-light text-zinc-800 mb-4">404</div>
        <h1 className="text-2xl font-light mb-3 text-white">Page not found</h1>
        <p className="text-zinc-500 max-w-xs mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-100 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => typeof window !== 'undefined' && window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all border border-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

