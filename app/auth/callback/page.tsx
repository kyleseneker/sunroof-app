'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  useEffect(() => {
    // Redirect to login - use the 6-digit code from email instead
    window.location.replace('/login');
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-4" />
      <p className="text-zinc-400">Redirecting...</p>
    </div>
  );
}
