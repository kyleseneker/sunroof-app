'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { fetchActiveJourneys } from '@/services';
import { CameraView, Dashboard, Intro, type CaptureMode } from '@/components/features';
import type { Journey } from '@/types';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [viewMode, setViewMode] = useState<'capture' | 'dashboard'>('dashboard');
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');

  // Redirect to login if not authenticated
  // Auth session is managed by Supabase's built-in storage (via lib/auth.tsx)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch active journeys with memory counts
  const loadActiveJourneys = useCallback(async () => {
    if (!user) return;
    
    setFetchError(false);
    
    try {
      const { data, error } = await fetchActiveJourneys(user.id);
      
      if (error) {
        console.error('Error fetching journeys:', error);
        setFetchError(true);
        return;
      }
      
      setActiveJourneys(data || []);
    } catch (err) {
      console.error('Fetch journeys exception:', err);
      setFetchError(true);
    }
  }, [user]);

  // Safe localStorage access (handles incognito/restricted modes)
  const safeGetItem = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  
  const safeSetItem = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage not available (incognito mode, storage full, etc.)
      console.warn('localStorage not available');
    }
  };

  useEffect(() => {
    async function checkSession() {
      if (!user) return;
      
      const introSeen = safeGetItem('sunroof_intro');
      if (introSeen) setHasSeenIntro(true);

      await loadActiveJourneys();
      setLoading(false);
    }
    checkSession();
  }, [loadActiveJourneys, user]);

  // Refetch data when user returns to the app (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasSeenIntro) {
        loadActiveJourneys();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadActiveJourneys, hasSeenIntro]);

  const handleIntroComplete = () => {
    safeSetItem('sunroof_intro', 'true');
    setHasSeenIntro(true);
  };

  // Show loading skeleton while checking auth or fetching data
  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] safe-top safe-bottom">
        {/* Skeleton Header */}
        <div className="flex justify-between items-center p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-muted)] shimmer-bg" />
            <div className="w-16 h-3 rounded bg-[var(--bg-muted)] shimmer-bg" />
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] shimmer-bg" />
            <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] shimmer-bg" />
            <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] shimmer-bg" />
          </div>
        </div>
        
        {/* Skeleton Content */}
        <div className="px-6">
          {/* Greeting skeleton */}
          <div className="w-32 h-4 rounded bg-[var(--bg-muted)] shimmer-bg mb-6" />
          
          {/* Section label skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[var(--bg-muted)]" />
            <div className="w-24 h-3 rounded bg-[var(--bg-muted)] shimmer-bg" />
          </div>
          
          {/* Journey card skeleton */}
          <div className="rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border-base)] p-6 h-48 shimmer-bg" />
        </div>
      </div>
    );
  }

  // Show error screen with retry button
  if (fetchError && activeJourneys.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-[var(--fg-base)]">Connection Error</h2>
        <p className="text-[var(--fg-muted)] mb-6 max-w-xs">Unable to load your journeys. Please check your internet connection and try again.</p>
        <button 
          onClick={() => {
            setLoading(true);
            loadActiveJourneys().finally(() => setLoading(false));
          }}
          className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hasSeenIntro) {
    return <Intro onComplete={handleIntroComplete} />;
  }

  // Show capture view for selected journey
  if (viewMode === 'capture' && selectedJourney) {
    return (
      <CameraView 
        journeyId={selectedJourney.id} 
        journeyName={selectedJourney.name}
        initialMode={captureMode}
        onClose={async () => {
          setViewMode('dashboard');
          setSelectedJourney(null);
          setCaptureMode('photo');
          // Refetch journeys to get updated memory counts
          await loadActiveJourneys();
        }} 
      />
    );
  }

  // Show dashboard with all active journeys
  return (
    <Dashboard 
      activeJourneys={activeJourneys} 
      onCapture={(journey, mode = 'photo') => {
        setSelectedJourney(journey);
        setCaptureMode(mode);
        setViewMode('capture');
      }} 
    />
  );
}
