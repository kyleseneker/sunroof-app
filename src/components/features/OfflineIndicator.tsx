'use client';
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] safe-top animate-enter">
      <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-sm font-medium text-white/90">Offline</span>
      </div>
    </div>
  );
}

