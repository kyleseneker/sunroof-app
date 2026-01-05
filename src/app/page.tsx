'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { useJourneys } from '@/hooks';
import { CameraView, DashboardV2 as Dashboard, Intro, type CaptureMode } from '@/components/features';
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
      <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 safe-top safe-bottom flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error screen with retry button
  if (error && activeJourneys.length === 0 && pastJourneys.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">Connection Error</h2>
        <p className="text-white/60 mb-6 max-w-xs">Unable to load your journeys. Please check your internet connection and try again.</p>
        <button 
          onClick={() => refresh()}
          className="px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 active:scale-95 transition-all"
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
