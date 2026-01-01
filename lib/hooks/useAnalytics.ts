'use client';

/**
 * Privacy-respecting analytics hook
 * Replace with your preferred analytics provider (Plausible, Fathom, PostHog, etc.)
 */

import { useCallback } from 'react';

export function useAnalytics() {
  const trackEvent = useCallback((name: string, properties?: Record<string, string | number | boolean>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics]', name, properties);
      return;
    }
    // Add your analytics provider here
  }, []);

  const trackPageView = useCallback((path?: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics] Page View:', path || window.location.pathname);
      return;
    }
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, string | number | boolean>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics] Identify:', userId, traits);
      return;
    }
  }, []);

  return {
    trackEvent,
    trackPageView,
    identify,
  };
}

export const AnalyticsEvents = {
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  SIGN_UP: 'sign_up',
  JOURNEY_CREATED: 'journey_created',
  JOURNEY_DELETED: 'journey_deleted',
  JOURNEY_SHARED: 'journey_shared',
  JOURNEY_UNLOCKED: 'journey_unlocked',
  MEMORY_CREATED: 'memory_created',
  MEMORY_DELETED: 'memory_deleted',
  PHOTO_UPLOADED: 'photo_uploaded',
  NOTE_SAVED: 'note_saved',
  AI_RECAP_GENERATED: 'ai_recap_generated',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  PWA_INSTALLED: 'pwa_installed',
  ERROR_OCCURRED: 'error_occurred',
  UPLOAD_FAILED: 'upload_failed',
} as const;

export default useAnalytics;
