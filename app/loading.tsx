import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-orange-500/10 to-transparent rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600 mb-4" />
        <p className="text-sm text-zinc-600">Loading...</p>
      </div>
    </div>
  );
}

