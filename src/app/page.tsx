'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { useJourneys } from '@/hooks';
import { CameraView, Dashboard, Intro, type CaptureMode } from '@/components/features';
import type { Journey } from '@/types';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);
  const [viewMode, setViewMode] = useState<'capture' | 'dashboard'>('dashboard');
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');

  // Use cached journey data - shows instantly on return visits
  const { 
    activeJourneys, 
    pastJourneys, 
    streak,
    isLoading, 
    error,
    refresh,
  } = useJourneys(user?.id);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Safe localStorage access (handles incognito/restricted modes)
  const safeGetItem = useCallback((key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, []);
  
  const safeSetItem = useCallback((key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage not available');
    }
  }, []);

  // Check intro status
  useEffect(() => {
    if (user) {
      const introSeen = safeGetItem('sunroof_intro');
      if (introSeen) setHasSeenIntro(true);
      setIntroChecked(true);
    }
  }, [user, safeGetItem]);

  const handleIntroComplete = () => {
    safeSetItem('sunroof_intro', 'true');
    setHasSeenIntro(true);
  };

  // Show loading skeleton while checking auth
  if (authLoading || !user || !introChecked) {
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
          <div className="w-32 h-4 rounded bg-[var(--bg-muted)] shimmer-bg mb-6" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[var(--bg-muted)]" />
            <div className="w-24 h-3 rounded bg-[var(--bg-muted)] shimmer-bg" />
          </div>
          <div className="rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border-base)] p-6 h-48 shimmer-bg" />
        </div>
      </div>
    );
  }

  // Show error screen with retry button
  if (error && activeJourneys.length === 0 && pastJourneys.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-error-subtle)] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-[var(--fg-base)]">Connection Error</h2>
        <p className="text-[var(--fg-muted)] mb-6 max-w-xs">Unable to load your journeys. Please check your internet connection and try again.</p>
        <button 
          onClick={() => refresh()}
          className="px-6 py-3 bg-[var(--fg-base)] text-[var(--fg-inverse)] rounded-full font-medium hover:opacity-90 active:scale-95 transition-all"
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
          // Refresh journey data to get updated memory counts
          refresh();
        }} 
      />
    );
  }

  // Show dashboard with all journey data (already cached)
  return (
    <Dashboard 
      activeJourneys={activeJourneys}
      pastJourneys={pastJourneys}
      streak={streak}
      isLoading={isLoading}
      onRefresh={refresh}
      onCapture={(journey, mode = 'photo') => {
        setSelectedJourney(journey);
        setCaptureMode(mode);
        setViewMode('capture');
      }} 
    />
  );
}
