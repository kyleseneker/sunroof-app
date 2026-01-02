'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Toggle, IconButton } from '@/components/ui';
import { 
  registerServiceWorker, 
  checkNotificationPermission, 
  requestNotificationPermission 
} from '@/lib';

interface NotificationPromptProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export default function NotificationPrompt({ onDismiss, compact = false }: NotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Check current permission
    checkNotificationPermission().then(setPermission);
    
    // Check if user dismissed before
    const wasDismissed = localStorage.getItem('notification-prompt-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    setLoading(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if already granted, denied, or dismissed
  if (permission === 'granted' || permission === 'denied' || dismissed) {
    return null;
  }

  // Don't show on server or if notifications not supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={handleEnable}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
      >
        <Bell className="w-4 h-4" />
        <span>Enable notifications</span>
      </button>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 border border-purple-500/20 animate-enter">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-purple-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--fg-base)] mb-1">Get notified when memories unlock</h3>
          <p className="text-sm text-[var(--fg-muted)] mb-3">
            We&apos;ll send you a notification when your journey is ready to view.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-full bg-[var(--bg-hover)] text-[var(--fg-muted)] text-sm hover:bg-[var(--bg-active)] transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        
        <IconButton 
          icon={<X className="w-4 h-4" />}
          label="Dismiss"
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
        />
      </div>
    </div>
  );
}

// Compact version for settings page
export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationPermission().then(setPermission);
  }, []);

  const handleToggle = async () => {
    if (permission === 'granted') {
      // Can't programmatically disable - direct to settings
      alert('To disable notifications, go to your browser settings.');
      return;
    }
    
    setLoading(true);
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    setLoading(false);
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface)]/50">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-[var(--fg-subtle)]" />
          <span className="text-[var(--fg-muted)]">Notifications not supported</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || permission === 'denied'}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-muted)]/50 transition-colors disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        {permission === 'granted' ? (
          <Bell className="w-5 h-5 text-purple-400" />
        ) : (
          <BellOff className="w-5 h-5 text-purple-400" />
        )}
        <div className="text-left">
          <span className="block text-[var(--fg-base)]">Push Notifications</span>
          <span className="text-xs text-[var(--fg-muted)]">
            {permission === 'granted' 
              ? 'You\'ll be notified when journeys unlock'
              : permission === 'denied'
              ? 'Blocked in browser settings'
              : 'Get notified when memories are ready'
            }
          </span>
        </div>
      </div>
      
      <Toggle 
        checked={permission === 'granted'} 
        onChange={() => {}} 
        activeColor="bg-purple-500"
        label="Toggle notifications"
      />
    </button>
  );
}

