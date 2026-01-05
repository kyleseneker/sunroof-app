'use client';
import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { IconButton } from '@/components/ui';

// TEMP: Set to true to test install prompt
const FORCE_SHOW = false;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    
    if (standalone) return; // Don't show if already installed

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if we've already dismissed recently
    const dismissed = localStorage.getItem('sunroof_install_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Don't show again for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event (Chrome/Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait a bit before showing to not interrupt initial experience
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show after a delay if not in standalone
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('sunroof_install_dismissed', Date.now().toString());
  };

  if ((!showPrompt || isStandalone) && !FORCE_SHOW) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-enter safe-bottom">
      <div className="bg-gradient-to-br from-amber-950/95 via-orange-950/95 to-slate-950/95 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-1">Install Sunroof</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              {isIOS 
                ? 'Tap the share button, then "Add to Home Screen" for the best experience.'
                : 'Add to your home screen for quick access and a native app experience.'
              }
            </p>
          </div>
          
          <IconButton 
            icon={<X className="w-4 h-4" />}
            label="Dismiss"
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            dark
            className="shrink-0 -mt-1 -mr-1"
          />
        </div>
        
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-4 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/20"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}

