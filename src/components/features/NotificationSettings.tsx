'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Toggle } from '@/components/ui';
import { checkNotificationPermission, requestNotificationPermission } from '@/lib';

/**
 * Notification settings toggle for profile/settings page.
 * Shows current permission status and allows enabling notifications.
 */
export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationPermission().then(setPermission);
  }, []);

  const handleToggle = async () => {
    if (permission === 'granted') {
      // Can't revoke via API - direct to browser settings
      return;
    }
    
    setLoading(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setLoading(false);
  };

  const isEnabled = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isEnabled 
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20' 
            : isDenied
              ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20'
              : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20'
        }`}>
          {isDenied ? (
            <BellOff className="w-5 h-5 text-red-400" />
          ) : (
            <Bell className={`w-5 h-5 ${isEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-white">Push Notifications</h3>
          <p className="text-sm text-white/50">
            {isEnabled 
              ? "You'll be notified when journeys unlock"
              : isDenied
                ? 'Blocked in browser settings'
                : 'Get notified when memories are ready'
            }
          </p>
        </div>
        
        <Toggle
          checked={isEnabled}
          onChange={handleToggle}
          disabled={loading || isDenied}
          label="Toggle notifications"
        />
      </div>
      
      {isDenied && (
        <p className="mt-3 text-xs text-white/40 text-center">
          To enable notifications, update your browser settings
        </p>
      )}
    </div>
  );
}

