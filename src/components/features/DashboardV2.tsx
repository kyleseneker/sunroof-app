'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { deleteJourney } from '@/services';
import { useAuth } from '@/providers';
import { hapticSuccess, hapticClick, getJourneyGradient, formatDate, getTimeUntilUnlock, isJourneyUnlocked, MAX_ACTIVE_JOURNEYS, ErrorMessages, SuccessMessages } from '@/lib';
import { Plus, ChevronRight, Sparkles, Trash2, HelpCircle, Camera, Pencil, Archive, EllipsisVertical, UserPlus, Mic, FileText, ChevronUp, Lock, ChevronLeft } from 'lucide-react';
import { useToast, Avatar, ConfirmDialog, IconButton, Badge } from '@/components/ui';
import { 
  GalleryView, 
  KeyboardShortcutsHelp, 
  useKeyboardShortcutsHelp, 
  ActionSheet,
  CreateJourneyModal,
  EditJourneyModal,
  InviteCollaboratorModal,
  ManageMemoriesSheet,
  HelpModal,
} from '@/components/features';
import Image from 'next/image';
import Link from 'next/link';
import type { Journey } from '@/types';
import type { CaptureMode } from './CameraView';

// Upgrade Unsplash URL to higher quality for full-screen use
function getHighResUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  // For Unsplash URLs, request larger size
  if (url.includes('images.unsplash.com')) {
    return url.replace(/w=\d+/, 'w=1400').replace(/q=\d+/, 'q=80');
  }
  return url;
}

interface DashboardProps {
  activeJourneys?: Journey[];
  pastJourneys?: Journey[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onCapture?: (journey: Journey, mode?: CaptureMode) => void;
}

// TEMP: Set to true to test empty states
const FORCE_EMPTY_STATE = false; // Change to true to test first-time user experience

export default function DashboardV2({ 
  activeJourneys: initialActiveJourneys = [], 
  pastJourneys: initialPastJourneys = [],
  isLoading: externalLoading = false,
  onRefresh,
  onCapture,
}: DashboardProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>(FORCE_EMPTY_STATE ? [] : initialActiveJourneys);
  const [pastJourneys, setPastJourneys] = useState<Journey[]>(FORCE_EMPTY_STATE ? [] : initialPastJourneys);
  
  // Sync with prop updates (respect FORCE_EMPTY_STATE for testing)
  useEffect(() => { if (!FORCE_EMPTY_STATE) setActiveJourneys(initialActiveJourneys); }, [initialActiveJourneys]);
  useEffect(() => { if (!FORCE_EMPTY_STATE) setPastJourneys(initialPastJourneys); }, [initialPastJourneys]);
  
  // Current journey index (for swiping between multiple active journeys)
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentJourney = activeJourneys[currentIndex] || null;
  
  // Vault visibility
  const [showVault, setShowVault] = useState(false);
  
  // Modal/sheet states
  const [isCreating, setIsCreating] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [inviteJourney, setInviteJourney] = useState<Journey | null>(null);
  const [managingJourney, setManagingJourney] = useState<Journey | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionSheetJourney, setActionSheetJourney] = useState<Journey | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Hero background image for empty state
  const [heroImage, setHeroImage] = useState<string | null>(null);
  
  // Fetch hero image on mount
  useEffect(() => {
    async function fetchHeroImage() {
      try {
        const response = await fetch('/api/cover-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'golden hour sunlight warm sky adventure freedom' }),
        });
        if (response.ok) {
          const { photo } = await response.json();
          if (photo?.url) {
            setHeroImage(photo.url);
          }
        }
      } catch {
        // Silently fail - gradient fallback is fine
      }
    }
    fetchHeroImage();
  }, []);
  
  // Keyboard shortcuts
  const { isOpen: showShortcuts, close: closeShortcuts } = useKeyboardShortcutsHelp();
  
  // Touch swiping for journey switching
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (activeJourneys.length <= 1) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0 && currentIndex < activeJourneys.length - 1) {
        hapticClick();
        setCurrentIndex(prev => prev + 1);
      } else if (deltaX > 0 && currentIndex > 0) {
        hapticClick();
        setCurrentIndex(prev => prev - 1);
      }
    }
  }, [activeJourneys.length, currentIndex]);
  
  const isOwner = (journey: Journey) => journey.user_id === user?.id;
  const isUnlocked = isJourneyUnlocked;
  const canCreateJourney = activeJourneys.length < MAX_ACTIVE_JOURNEYS;

  // Delete journey handler
  const handleDeleteJourney = async (journeyId: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    try {
      const { error } = await deleteJourney(journeyId);
      if (error) {
        showToast(ErrorMessages.DELETE_FAILED('journey'), 'error');
        setIsDeleting(false);
        return;
      }
      hapticSuccess();
      showToast(SuccessMessages.DELETED('Journey'), 'success');
      setDeleteConfirm(null);
      window.location.reload();
    } catch (err) {
      console.error('Delete journey error:', err);
      showToast(ErrorMessages.GENERIC, 'error');
      setIsDeleting(false);
    }
  };

  const handleJourneyUpdated = (updated: Journey) => {
    setActiveJourneys(prev => prev.map(j => 
      j.id === updated.id ? { ...updated, memory_count: updated.memory_count ?? j.memory_count } : j
    ));
    setPastJourneys(prev => prev.map(j => 
      j.id === updated.id ? { ...updated, memory_count: updated.memory_count ?? j.memory_count } : j
    ));
  };

  const handleMemoryDeleted = (journeyId: string, newCount: number) => {
    setActiveJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, memory_count: newCount } : j));
    setPastJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, memory_count: newCount } : j));
  };

  // --- MODALS & SHEETS ---
  if (isCreating && user) {
    return (
      <CreateJourneyModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        userId={user.id}
        onSuccess={() => window.location.reload()}
      />
    );
  }

  if (editingJourney) {
    return (
      <EditJourneyModal
        journey={editingJourney}
        onClose={() => setEditingJourney(null)}
        onSuccess={handleJourneyUpdated}
      />
    );
  }

  if (managingJourney) {
    return (
      <ManageMemoriesSheet
        journey={managingJourney}
        onClose={() => setManagingJourney(null)}
        onMemoryDeleted={handleMemoryDeleted}
      />
    );
  }

  if (selectedJourney) {
    return (
      <GalleryView 
        journey={selectedJourney} 
        onClose={() => setSelectedJourney(null)}
        onMemoryDeleted={() => {
          setPastJourneys(prev => prev.map(j => 
            j.id === selectedJourney.id 
              ? { ...j, memory_count: Math.max(0, (j.memory_count || 1) - 1) }
              : j
          ));
        }}
        onJourneyUpdated={(updatedJourney) => {
          setSelectedJourney(updatedJourney);
          setPastJourneys(prev => prev.map(j => 
            j.id === updatedJourney.id ? updatedJourney : j
          ));
        }}
      />
    );
  }

  if (showHelp) {
    return <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />;
  }

  // --- VAULT SHEET ---
  if (showVault) {
    const totalMemories = pastJourneys.reduce((acc, j) => acc + (j.memory_count || 0), 0);
    const unlockedJourneys = pastJourneys.filter(j => isUnlocked(j));
    const lockedJourneys = pastJourneys.filter(j => !isUnlocked(j));
    
    return (
      <div className="fixed inset-0 z-50 safe-top safe-bottom overflow-hidden flex flex-col">
        {/* Unified warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
        
        {/* Header */}
        <header className="relative z-10 shrink-0">
          
          <div className="p-6">
            <IconButton 
              icon={<ChevronLeft className="w-5 h-5" />}
              label="Back to dashboard"
              onClick={() => setShowVault(false)}
              variant="ghost"
              dark
            />
          </div>
            
          {/* Hero */}
          <div className="text-center px-6 pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Archive className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-1">Memory Vault</h1>
            <p className="text-white/60">
              {totalMemories} {totalMemories === 1 ? 'memory' : 'memories'} across {pastJourneys.length} {pastJourneys.length === 1 ? 'journey' : 'journeys'}
            </p>
          </div>
        </header>
        
        {/* Vault Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-6">
          {pastJourneys.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <Archive className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 mb-1">No memories yet</p>
              <p className="text-sm text-white/40">Complete a journey to unlock your memories</p>
            </div>
          ) : (
            <>
              {/* Unlocked journeys - larger cards */}
              {unlockedJourneys.length > 0 && (
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/60">
                      Ready to Explore
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {unlockedJourneys.map((journey, i) => (
                      <button
                        key={journey.id}
                        onClick={() => setSelectedJourney(journey)}
                        className="relative w-full h-36 rounded-2xl overflow-hidden group active:scale-[0.98] transition-transform"
                      >
                        {/* Background */}
                        {journey.cover_image_url ? (
                          <Image
                            src={journey.cover_image_url}
                            alt=""
                            fill
                            sizes="100vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority={i === 0}
                          />
                        ) : (
                          <div 
                            className="absolute inset-0" 
                            style={{ background: getJourneyGradient(journey.name).gradient }} 
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        
                        {/* Content - bottom aligned */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end">
                          <div className="flex items-center gap-2 mb-1">
                            {journey.emoji && <span className="text-xl drop-shadow-lg">{journey.emoji}</span>}
                            <h3 className="font-semibold text-white text-lg truncate drop-shadow-lg">{journey.name}</h3>
                          </div>
                          <p className="text-white/80 text-sm drop-shadow-md">
                            {formatDate(journey.created_at, { month: 'short', day: 'numeric' })} – {formatDate(journey.unlock_date, { month: 'short', day: 'numeric' })} · {journey.memory_count || 0} memories
                          </p>
                        </div>
                        
                        {/* Shared badge */}
                        {!isOwner(journey) && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="info">Shared</Badge>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              
              {/* Locked journeys - smaller list */}
              {lockedJourneys.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-white/40" />
                    <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/60">
                      Still Locked
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {lockedJourneys.map((journey) => (
                      <div
                        key={journey.id}
                        className="p-3 rounded-xl bg-white/5 flex items-center gap-3 opacity-70"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0">
                          {journey.cover_image_url ? (
                            <Image src={journey.cover_image_url} alt="" fill sizes="40px" className="object-cover blur-sm" />
                          ) : (
                            <div className="absolute inset-0" style={{ background: getJourneyGradient(journey.name).gradient }} />
                          )}
                          <div className="absolute inset-0 bg-black/40" />
                          <Lock className="w-4 h-4 text-white/60 relative z-10" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-sm truncate">
                            {journey.emoji && <span className="mr-1">{journey.emoji}</span>}
                            {journey.name}
                          </h3>
                          <p className="text-xs text-white/50">
                            Unlocks in {getTimeUntilUnlock(journey.unlock_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  
  // Loading state
  if (externalLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Empty state - no journeys at all
  if (activeJourneys.length === 0 && pastJourneys.length === 0) {
    return (
      <div className="h-[100dvh] flex flex-col safe-top safe-bottom overflow-hidden relative">
        {/* Background - Sunroof themed image or gradient fallback */}
        <div className="absolute inset-0">
          {heroImage ? (
            <>
              <Image
                src={getHighResUrl(heroImage)!}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-rose-900" />
              {/* Animated orbs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-40 right-10 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-breathe" />
              </div>
            </>
          )}
        </div>
        
        {/* Header */}
        <header className="relative z-10 flex justify-between items-center p-6">
          <div className="flex items-center gap-2">
            <Image src="/icon.svg" alt="Sunroof" width={22} height={22} className="brightness-0 invert opacity-80" />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/60">Sunroof</span>
          </div>
          <div className="flex items-center gap-2">
            <IconButton 
              icon={<HelpCircle className="w-5 h-5" />}
              label="Help"
              onClick={() => setShowHelp(true)}
              variant="ghost"
              dark
            />
            <Link href="/profile">
              <Avatar 
                src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                name={user?.user_metadata?.display_name || user?.user_metadata?.full_name}
                email={user?.email}
                size="md"
              />
            </Link>
          </div>
        </header>
        
        {/* Main content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* Floating polaroid-style cards */}
          <div className="relative w-48 h-48 mb-10">
            <div className="absolute inset-0 bg-white rounded-lg shadow-2xl rotate-[-8deg] p-2 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-full h-32 bg-gradient-to-br from-sky-400 to-blue-500 rounded" />
              <div className="h-6 flex items-center justify-center">
                <div className="w-16 h-1.5 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="absolute inset-0 bg-white rounded-lg shadow-2xl rotate-[5deg] p-2 animate-float" style={{ animationDelay: '1s' }}>
              <div className="w-full h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded" />
              <div className="h-6 flex items-center justify-center">
                <div className="w-20 h-1.5 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="absolute inset-0 bg-white rounded-lg shadow-2xl rotate-[-2deg] p-2 animate-float">
              <div className="w-full h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded flex items-center justify-center">
                <Camera className="w-8 h-8 text-white/80" />
              </div>
              <div className="h-6 flex items-center justify-center">
                <div className="w-12 h-1.5 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-light text-white mb-4">
            Your story starts here
          </h1>
          <p className="text-lg text-white/70 max-w-xs mx-auto leading-relaxed mb-10">
            Capture moments now. Unlock them later. Like developing film from your adventures.
          </p>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg shadow-2xl hover:shadow-white/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Start a Journey</span>
          </button>
          
          <div className="mt-10 flex items-center gap-6 text-white/50 text-sm">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4" /> Photos
            </span>
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4" /> Voice
            </span>
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Notes
            </span>
          </div>
        </main>
        
        <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={closeShortcuts} />
      </div>
    );
  }

  // No active journeys but has vault - Focus on NEXT adventure
  if (activeJourneys.length === 0 && pastJourneys.length > 0) {
    const totalMemories = pastJourneys.reduce((acc, j) => acc + (j.memory_count || 0), 0);
    const unlockedCount = pastJourneys.filter(j => isUnlocked(j)).length;
    
    return (
      <div className="h-[100dvh] flex flex-col safe-top safe-bottom overflow-hidden relative">
        {/* Background - Sunroof themed image or gradient fallback */}
        <div className="absolute inset-0">
          {heroImage ? (
            <>
              <Image
                src={getHighResUrl(heroImage)!}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900">
              {/* Ambient animated elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl animate-breathe" />
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <header className="relative z-20 flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Avatar 
                src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                name={user?.user_metadata?.display_name || user?.user_metadata?.full_name}
                email={user?.email}
                size="md"
              />
            </Link>
          </div>
          
          {/* Centered logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Image src="/icon.svg" alt="Sunroof" width={20} height={20} className="brightness-0 invert opacity-80" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/60">Sunroof</span>
          </div>
          
          <IconButton 
            icon={<HelpCircle className="w-5 h-5" />}
            label="Help"
            onClick={() => setShowHelp(true)}
            variant="ghost"
            dark
          />
        </header>

        {/* Main content - forward looking */}
        <main className="relative z-10 flex-1 flex flex-col justify-center p-6">
          <div className="text-center">
            {/* Headline */}
            <h1 className="text-4xl font-light text-white mb-4">
              Where to next?
            </h1>
            <p className="text-white/60 text-lg mb-12 max-w-xs mx-auto">
              Start a new journey and capture moments that matter
            </p>
            
            {/* Primary CTA - New Journey */}
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full max-w-xs mx-auto h-16 bg-white text-black rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-white/10 active:scale-[0.98] transition-all mb-4"
            >
              <Plus className="w-6 h-6" />
              Start New Journey
            </button>
            
            {/* Vault access - secondary but visible */}
            <button 
              onClick={() => setShowVault(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all active:scale-[0.98]"
            >
              <Archive className="w-4 h-4" />
              <span>Memory Vault</span>
              {totalMemories > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {totalMemories}
                </span>
              )}
            </button>
          </div>
        </main>
        
        <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={closeShortcuts} />
      </div>
    );
  }

  // --- IMMERSIVE ACTIVE JOURNEY VIEW ---
  const totalVaultMemories = pastJourneys.reduce((acc, j) => acc + (j.memory_count || 0), 0);
  
  return (
    <div 
      className="h-[100dvh] flex flex-col safe-top safe-bottom overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-screen cover image */}
      <div className="absolute inset-0">
        {currentJourney?.cover_image_url ? (
          <Image
            src={getHighResUrl(currentJourney.cover_image_url)!}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : currentJourney ? (
          <div 
            className="absolute inset-0" 
            style={{ background: getJourneyGradient(currentJourney.name).gradient }}
          />
        ) : null}
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
      </div>

      {/* Header - floating over image */}
      <header className="relative z-20 flex justify-between items-center p-6">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Avatar 
              src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
              name={user?.user_metadata?.display_name || user?.user_metadata?.full_name}
              email={user?.email}
              size="md"
            />
          </Link>
        </div>
        
        {/* Centered logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Image src="/icon.svg" alt="Sunroof" width={20} height={20} className="brightness-0 invert opacity-80" />
          <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/60">Sunroof</span>
        </div>
        
        <div className="flex items-center gap-2">
          {canCreateJourney && (
            <IconButton 
              icon={<Plus className="w-5 h-5" />}
              label="Create journey"
              onClick={() => setIsCreating(true)}
              variant="ghost"
              dark
            />
          )}
          {currentJourney && isOwner(currentJourney) && (
            <IconButton 
              icon={<EllipsisVertical className="w-5 h-5" />}
              label="Journey options"
              onClick={() => setActionSheetJourney(currentJourney)}
              variant="ghost"
              dark
            />
          )}
        </div>
      </header>

      {/* Main content - journey info */}
      <main className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-8">
        {currentJourney && (
          <>
            {/* Journey pagination dots */}
            {activeJourneys.length > 1 && (
              <div className="flex justify-center gap-2 mb-6">
                {activeJourneys.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { hapticClick(); setCurrentIndex(i); }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex 
                        ? 'w-6 bg-white' 
                        : 'w-1.5 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Countdown timer - the hero */}
            <div className="text-center mb-8">
              <p className="text-white/60 text-sm uppercase tracking-wider mb-2">Unlocks in</p>
              <p className="text-5xl font-light text-white tracking-tight">
                {getTimeUntilUnlock(currentJourney.unlock_date)}
              </p>
            </div>
            
            {/* Journey name */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-white mb-2">
                {currentJourney.emoji && <span className="mr-2">{currentJourney.emoji}</span>}
                {currentJourney.name}
              </h1>
              {(currentJourney.memory_count ?? 0) > 0 && (
                <p className="text-white/70">
                  {currentJourney.memory_count} {currentJourney.memory_count === 1 ? 'memory' : 'memories'} captured
                </p>
              )}
              {!isOwner(currentJourney) && (
                <div className="mt-2">
                  <Badge variant="info">Shared with you</Badge>
                </div>
              )}
            </div>
            
            {/* Capture buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => onCapture?.(currentJourney, 'photo')}
                className="flex-1 h-14 bg-white text-black rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all"
              >
                <Camera className="w-5 h-5" />
                Capture
              </button>
              <button 
                onClick={() => onCapture?.(currentJourney, 'audio')}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl flex items-center justify-center active:scale-[0.95] transition-all"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onCapture?.(currentJourney, 'text')}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl flex items-center justify-center active:scale-[0.95] transition-all"
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </main>

      {/* Vault peek - tap to expand */}
      {pastJourneys.length > 0 && (
        <button 
          onClick={() => setShowVault(true)}
          className="relative z-10 flex flex-col items-center pb-6 pt-2 group"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white group-hover:bg-white/20 transition-all">
            <Archive className="w-4 h-4" />
            <span className="text-sm font-medium">Memory Vault</span>
            {totalVaultMemories > 0 && (
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{totalVaultMemories}</span>
            )}
          </div>
        </button>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteJourney(deleteConfirm)}
        title="Delete Journey?"
        description="This will permanently delete this journey and all its memories. This cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        loading={isDeleting}
      />
      
      <InviteCollaboratorModal
        journey={inviteJourney}
        onClose={() => setInviteJourney(null)}
        onSuccess={handleJourneyUpdated}
      />
      
      <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={closeShortcuts} />
      
      {/* Action Sheet */}
      <ActionSheet
        isOpen={!!actionSheetJourney}
        onClose={() => setActionSheetJourney(null)}
        options={[
          {
            label: 'Capture Photo',
            icon: <Camera className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) onCapture?.(actionSheetJourney, 'photo'); },
          },
          {
            label: 'Record Audio',
            icon: <Mic className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) onCapture?.(actionSheetJourney, 'audio'); },
          },
          {
            label: 'Write Note',
            icon: <FileText className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) onCapture?.(actionSheetJourney, 'text'); },
          },
          {
            label: 'Edit Journey',
            icon: <Pencil className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) setEditingJourney(actionSheetJourney); },
          },
          {
            label: 'Manage Memories',
            icon: <Sparkles className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) setManagingJourney(actionSheetJourney); },
          },
          {
            label: 'Invite Collaborator',
            icon: <UserPlus className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) setInviteJourney(actionSheetJourney); },
          },
          {
            label: 'Delete Journey',
            icon: <Trash2 className="w-5 h-5" />,
            variant: 'danger',
            onClick: () => { if (actionSheetJourney) setDeleteConfirm(actionSheetJourney.id); },
          },
        ]}
      />
    </div>
  );
}

