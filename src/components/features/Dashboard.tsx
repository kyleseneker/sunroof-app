'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  deleteJourney, 
  fetchPastJourneys as fetchPastJourneysService,
  getMemoryStreak,
} from '@/services';
import { useAuth } from '@/providers';
import { hapticSuccess, getJourneyGradient, formatDate, getTimeUntilUnlock, isJourneyUnlocked, getGreeting, MAX_ACTIVE_JOURNEYS } from '@/lib';
import { Plus, ArrowRight, X, Lock, ChevronRight, Sparkles, Trash2, HelpCircle, Camera, ImageIcon, Pencil, Timer, Archive, Search, RefreshCw, EllipsisVertical, UserPlus, Mic, FileText, Flame } from 'lucide-react';
import { useToast, Avatar, ConfirmDialog, IconButton, Badge } from '@/components/ui';
import { 
  GalleryView, 
  KeyboardShortcutsHelp, 
  useKeyboardShortcutsHelp, 
  MemoryBadge, 
  ActionSheet,
  CreateJourneyModal,
  EditJourneyModal,
  InviteCollaboratorModal,
  ManageMemoriesSheet,
  JourneyDetailSheet,
  HelpModal,
} from '@/components/features';
import Image from 'next/image';
import Link from 'next/link';
import type { Journey } from '@/types';

type CaptureMode = 'photo' | 'text' | 'audio';

interface DashboardProps {
  activeJourneys?: Journey[];
  onCapture?: (journey: Journey, mode?: CaptureMode) => void;
}

export default function Dashboard({ activeJourneys: initialActiveJourneys = [], onCapture }: DashboardProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>(initialActiveJourneys);
  
  // Sync with prop updates
  useEffect(() => {
    setActiveJourneys(initialActiveJourneys);
  }, [initialActiveJourneys]);
  
  // Modal/sheet states
  const [isCreating, setIsCreating] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [inviteJourney, setInviteJourney] = useState<Journey | null>(null);
  const [managingJourney, setManagingJourney] = useState<Journey | null>(null);
  const [focusedJourney, setFocusedJourney] = useState<Journey | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Data states
  const [pastJourneys, setPastJourneys] = useState<Journey[]>([]);
  const [pastJourneysLoading, setPastJourneysLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  
  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const isPullingRef = useRef(false);
  const pullStartY = useRef(0);
  const pullDistanceRef = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  const PULL_THRESHOLD = 80;
  
  // Keyboard shortcuts help modal (desktop only)
  const { isOpen: showShortcuts, close: closeShortcuts } = useKeyboardShortcutsHelp();
  
  // Action sheet for journey actions (mobile-friendly)
  const [actionSheetJourney, setActionSheetJourney] = useState<Journey | null>(null);
  
  // Detect if user is on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch past/completed journeys and streak
  const fetchPastJourneys = useCallback(async () => {
    if (!user) return;
    const { data, error } = await fetchPastJourneysService(user.id);
    if (error) {
      console.error('Error fetching past journeys:', error);
      setPastJourneysLoading(false);
      return;
    }
    setPastJourneys(data || []);
    setPastJourneysLoading(false);

    // Fetch streak in background
    const { data: streakData } = await getMemoryStreak(user.id);
    if (streakData !== null) setStreak(streakData);
  }, [user]);

  useEffect(() => {
    fetchPastJourneys();
  }, [fetchPastJourneys]);

  // Check if current user owns this journey
  const isOwner = (journey: Journey) => journey.user_id === user?.id;
  const isUnlocked = isJourneyUnlocked;
  const canCreateJourney = activeJourneys.length < MAX_ACTIVE_JOURNEYS;

  // Auto-close search when no journeys exist
  useEffect(() => {
    if (activeJourneys.length === 0 && pastJourneys.length === 0) {
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [activeJourneys.length, pastJourneys.length]);

  // Global escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null);
        else if (isCreating) setIsCreating(false);
        else if (showHelp) setShowHelp(false);
        else if (showSearch) { setShowSearch(false); setSearchQuery(''); }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [deleteConfirm, isCreating, showHelp, showSearch]);

  // Filtered journeys based on search
  const filteredActiveJourneys = useMemo(() => {
    if (!searchQuery.trim()) return activeJourneys;
    const q = searchQuery.toLowerCase();
    return activeJourneys.filter(j => j.name.toLowerCase().includes(q));
  }, [activeJourneys, searchQuery]);

  const filteredPastJourneys = useMemo(() => {
    if (!searchQuery.trim()) return pastJourneys;
    const q = searchQuery.toLowerCase();
    return pastJourneys.filter(j => j.name.toLowerCase().includes(q));
  }, [pastJourneys, searchQuery]);

  // Pull to refresh handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPastJourneys();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [fetchPastJourneys]);

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const element = mainRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop <= 5) {
        pullStartY.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY.current;
      
      if (diff > 0 && element.scrollTop <= 5) {
        e.preventDefault();
        const resistance = 0.4;
        const newDistance = Math.min(diff * resistance, PULL_THRESHOLD * 1.5);
        pullDistanceRef.current = newDistance;
        setPullDistance(newDistance);
      } else if (diff <= 0) {
        isPullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;
      if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshing) {
        await handleRefresh();
      }
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, handleRefresh]);

  // Delete journey handler
  const handleDeleteJourney = async (journeyId: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    try {
      const { error } = await deleteJourney(journeyId);
      if (error) {
        showToast('Failed to delete journey', 'error');
        setIsDeleting(false);
        return;
      }
      hapticSuccess();
      showToast('Journey deleted', 'success');
      setDeleteConfirm(null);
      window.location.reload();
    } catch (err) {
      console.error('Delete journey error:', err);
      showToast('Something went wrong', 'error');
      setIsDeleting(false);
    }
  };

  // Update journey in local state, preserving memory_count if not provided
  const handleJourneyUpdated = (updated: Journey) => {
    setActiveJourneys(prev => prev.map(j => 
      j.id === updated.id ? { ...updated, memory_count: updated.memory_count ?? j.memory_count } : j
    ));
    setPastJourneys(prev => prev.map(j => 
      j.id === updated.id ? { ...updated, memory_count: updated.memory_count ?? j.memory_count } : j
    ));
    if (focusedJourney?.id === updated.id) {
      setFocusedJourney({ ...updated, memory_count: updated.memory_count ?? focusedJourney.memory_count });
    }
  };

  // Handle memory count update from ManageMemoriesSheet
  const handleMemoryDeleted = (journeyId: string, newCount: number) => {
    setActiveJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, memory_count: newCount } : j));
    setPastJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, memory_count: newCount } : j));
    if (focusedJourney?.id === journeyId) {
      setFocusedJourney({ ...focusedJourney, memory_count: newCount });
    }
  };

  // --- MODALS & SHEETS ---
  
  // Create Journey Modal
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

  // Edit Journey Modal
  if (editingJourney) {
    return (
      <EditJourneyModal
        journey={editingJourney}
        onClose={() => setEditingJourney(null)}
        onSuccess={(updatedJourney) => {
          // Update journey in lists
          handleJourneyUpdated(updatedJourney);
          // If we were viewing this journey, update the focused journey too
          if (focusedJourney?.id === updatedJourney.id) {
            setFocusedJourney(updatedJourney);
          }
        }}
      />
    );
  }

  // Manage Memories Sheet
  if (managingJourney) {
    return (
      <ManageMemoriesSheet
        journey={managingJourney}
        onClose={() => setManagingJourney(null)}
        onMemoryDeleted={handleMemoryDeleted}
      />
    );
  }

  // Journey Detail Sheet (focused journey)
  if (focusedJourney) {
    return (
      <>
        <JourneyDetailSheet
          journey={focusedJourney}
          onClose={() => setFocusedJourney(null)}
          onCapture={(j, mode) => { setFocusedJourney(null); onCapture?.(j, mode); }}
          onEdit={(j) => setEditingJourney(j)}
          onDelete={(id) => setDeleteConfirm(id)}
          onManageMemories={(j) => setManagingJourney(j)}
          onInvite={(j) => setInviteJourney(j)}
          isOwner={isOwner(focusedJourney)}
          onJourneyUpdated={handleJourneyUpdated}
        />
        {/* Delete Confirmation Dialog - needs to render on top of detail sheet */}
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
        {/* Invite Modal - needs to render on top of detail sheet */}
        <InviteCollaboratorModal
          journey={inviteJourney}
          onClose={() => setInviteJourney(null)}
          onSuccess={handleJourneyUpdated}
        />
      </>
    );
  }

  // Gallery View (for unlocked journeys)
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

  // Help Modal
  if (showHelp) {
    return <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />;
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="h-[100dvh] flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Delete Confirmation Dialog */}
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
      
      {/* Invite Collaborator Modal */}
      <InviteCollaboratorModal
        journey={inviteJourney}
        onClose={() => setInviteJourney(null)}
        onSuccess={handleJourneyUpdated}
      />

      {/* Header */}
      <header className="flex justify-between items-center p-6 pb-4">
        <div className="flex items-center gap-2">
          <Image src="/icon.svg" alt="Sunroof" width={22} height={22} />
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[var(--fg-muted)]">Sunroof</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Button */}
          {(activeJourneys.length > 0 || pastJourneys.length > 0) && (
            <IconButton 
              icon={<Search className="w-4 h-4" />}
              label="Search journeys"
              onClick={() => setShowSearch(!showSearch)}
              variant="bordered"
              active={showSearch}
            />
          )}
          <IconButton 
            icon={<HelpCircle className="w-4 h-4" />}
            label="Help"
            onClick={() => setShowHelp(true)}
            variant="bordered"
          />
          <IconButton 
            icon={<Plus className="w-4 h-4" />}
            label="Create journey"
            onClick={() => {
              if (canCreateJourney) {
                setIsCreating(true);
              } else {
                showToast(`Maximum ${MAX_ACTIVE_JOURNEYS} active journeys allowed`, 'error');
              }
            }}
            variant="bordered"
          />
          {/* Profile Avatar */}
          <Link 
            href="/profile"
            className="hover:opacity-90 active:scale-95 transition-all"
            title="Profile"
          >
            <Avatar 
              src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
              name={user?.user_metadata?.display_name || user?.user_metadata?.full_name}
              email={user?.email}
              size="md"
            />
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-6 pb-4 animate-enter">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Search journeys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-10 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl text-[var(--fg-base)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:border-[var(--fg-subtle)] transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg-base)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-[var(--fg-muted)] mt-2">
              Found {filteredActiveJourneys.length + filteredPastJourneys.length} {(filteredActiveJourneys.length + filteredPastJourneys.length) === 1 ? 'journey' : 'journeys'}
            </p>
          )}
        </div>
      )}

      {/* Pull to Refresh Indicator */}
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ 
          height: isRefreshing ? 60 : pullDistance,
          opacity: (pullDistance / PULL_THRESHOLD) || (isRefreshing ? 1 : 0)
        }}
      >
        <div className={`flex items-center gap-2 ${isRefreshing ? 'animate-pulse' : ''}`}>
          <RefreshCw 
            className={`w-5 h-5 text-zinc-500 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: isRefreshing ? undefined : `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)` }}
          />
          <span className="text-sm text-zinc-500">
            {isRefreshing ? 'Refreshing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      <main ref={mainRef} className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-hide overscroll-contain">
        
        {/* Welcome Section */}
        {(activeJourneys.length > 0 || pastJourneys.length > 0) && (
          <div className="mb-8 animate-enter">
            <h1 className="text-2xl font-light mb-1 text-[var(--fg-muted)]">
              {getGreeting()}, <span className="text-[var(--fg-base)]">{user?.user_metadata?.display_name?.split(' ')[0] || 'traveler'}</span>
            </h1>
            <p className="text-[var(--fg-muted)] text-sm mb-4">
              {activeJourneys.length > 0 
                ? `You have ${activeJourneys.length} ${activeJourneys.length === 1 ? 'journey' : 'journeys'} in progress`
                : pastJourneys.length > 0 
                  ? `${pastJourneys.length} ${pastJourneys.length === 1 ? 'journey' : 'journeys'} in your vault`
                  : 'Welcome to Sunroof'
              }
            </p>
            
            {/* Stats Pills - only show contextually relevant stats */}
            <div className="flex flex-wrap gap-2">
              {/* Streak - only relevant with active journeys */}
              {activeJourneys.length > 0 && streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-medium text-[var(--fg-base)]">{streak} day streak</span>
                </div>
              )}

              {/* Next unlock - only if active journeys */}
              {activeJourneys.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-[var(--fg-base)]">
                    {getTimeUntilUnlock(
                      [...activeJourneys].sort((a, b) => 
                        new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime()
                      )[0].unlock_date
                    )} until unlock
                  </span>
                </div>
              )}

              {/* Ready to explore - only if there are unlocked journeys */}
              {pastJourneys.filter(j => isJourneyUnlocked(j)).length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-[var(--fg-base)]">
                    {pastJourneys.filter(j => isJourneyUnlocked(j)).length} ready to explore
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Active Trips Section */}
        <section className="mb-10">
          {activeJourneys.length > 0 ? (
            <div className="animate-enter">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-400">
                  Active {activeJourneys.length === 1 ? 'Journey' : 'Journeys'}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/30 to-transparent ml-2" />
              </div>
              
              <div className="space-y-4">
                {filteredActiveJourneys.map((journey, index) => (
                  <div 
                    key={journey.id}
                    onClick={() => setFocusedJourney(journey)}
                    onContextMenu={(e) => {
                      if (isOwner(journey)) {
                        e.preventDefault();
                        setActionSheetJourney(journey);
                      }
                    }}
                    className="relative w-full glass rounded-[28px] p-6 overflow-hidden border border-[var(--border-base)] cursor-pointer card-glow active:scale-[0.98] transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Dynamic gradient background */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: getJourneyGradient(journey.name).gradient }} />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[var(--bg-base)]/90 via-[var(--bg-base)]/50 to-transparent" />
                    <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                      backgroundImage: `radial-gradient(circle at 25% 25%, var(--fg-base) 0%, transparent 50%),
                                        radial-gradient(circle at 75% 75%, var(--fg-base) 0%, transparent 50%)`
                    }} />
                    
                    <div className="relative z-10 flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-base)]/70 backdrop-blur-sm text-[var(--fg-base)] text-xs font-medium">
                            <Timer className="w-3 h-3" />
                            {getTimeUntilUnlock(journey.unlock_date)}
                          </span>
                          {!isOwner(journey) && (
                            <Badge variant="info">Shared</Badge>
                          )}
                        </div>
                        {(journey.memory_count ?? 0) > 0 && (
                          <div className="mt-1">
                            <MemoryBadge count={journey.memory_count ?? 0} isLocked={true} variant="compact" />
                          </div>
                        )}
                      </div>
                      {/* Owner-only action buttons */}
                      {isOwner(journey) && (
                        isMobile ? (
                          <IconButton 
                            icon={<EllipsisVertical className="w-5 h-5" />}
                            label="Journey options"
                            onClick={(e) => { e.stopPropagation(); setActionSheetJourney(journey); }}
                            variant="ghost"
                            dark
                          />
                        ) : (
                          <div className="flex gap-1">
                            <IconButton 
                              icon={<UserPlus className="w-3.5 h-3.5" />}
                              label="Share journey"
                              onClick={(e) => { e.stopPropagation(); setInviteJourney(journey); }}
                              variant="bordered"
                              size="sm"
                              dark
                            />
                            <IconButton 
                              icon={<Pencil className="w-3.5 h-3.5" />}
                              label="Edit journey"
                              onClick={(e) => { e.stopPropagation(); setEditingJourney(journey); }}
                              variant="bordered"
                              size="sm"
                              dark
                            />
                            <IconButton 
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              label="Delete journey"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(journey.id); }}
                              variant="bordered"
                              size="sm"
                              dark
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div className="relative z-10">
                      <h2 className="text-3xl font-light tracking-tight mb-4 break-words text-[var(--fg-base)]">
                        {journey.emoji && <span className="mr-2">{journey.emoji}</span>}
                        {journey.name}
                      </h2>
                      {/* Quick Capture Buttons */}
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onCapture?.(journey, 'photo'); }}
                          className="flex-1 h-10 bg-[var(--fg-base)]/15 backdrop-blur-sm border border-[var(--fg-base)]/20 rounded-full font-medium text-sm text-[var(--fg-base)] flex items-center justify-center gap-1.5 hover:bg-[var(--fg-base)]/25 active:scale-[0.98] transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          Photo
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onCapture?.(journey, 'audio'); }}
                          className="flex-1 h-10 bg-[var(--fg-base)]/15 backdrop-blur-sm border border-[var(--fg-base)]/20 rounded-full font-medium text-sm text-[var(--fg-base)] flex items-center justify-center gap-1.5 hover:bg-[var(--fg-base)]/25 active:scale-[0.98] transition-all"
                        >
                          <Mic className="w-4 h-4" />
                          Voice
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onCapture?.(journey, 'text'); }}
                          className="flex-1 h-10 bg-[var(--fg-base)]/15 backdrop-blur-sm border border-[var(--fg-base)]/20 rounded-full font-medium text-sm text-[var(--fg-base)] flex items-center justify-center gap-1.5 hover:bg-[var(--fg-base)]/25 active:scale-[0.98] transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Note
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : pastJourneysLoading ? (
            /* Loading state while fetching past journeys */
            <div className="text-center py-8 animate-enter">
              <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
              <p className="text-zinc-500 text-sm">Loading your journeys...</p>
            </div>
          ) : pastJourneys.length === 0 ? (
            /* Empty state - first time user */
            <div className="text-center py-12 animate-enter">
              <div className="relative w-40 h-40 mx-auto mb-8 empty-illustration">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-500/20 animate-breathe" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center shadow-2xl">
                  <div className="relative">
                    <Camera className="w-10 h-10 text-zinc-500" />
                    <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-orange-400 animate-pulse" />
                  </div>
                </div>
                <div className="absolute top-2 right-6 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 animate-float" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 -right-2 w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 animate-float" style={{ animationDelay: '1s' }} />
              </div>
              
              <h2 className="text-3xl font-light text-white mb-3">Ready for an adventure?</h2>
              <p className="text-base text-zinc-500 mb-10 max-w-[280px] mx-auto leading-relaxed">
                Start a journey to capture photos and notes that unlock later. Like developing film.
              </p>
              
              <button 
                onClick={() => setIsCreating(true)}
                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-400 to-pink-500 rounded-full text-base font-semibold text-white hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] transition-all btn-shine cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Start Your First Journey</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="mt-6 text-xs text-zinc-600">Takes 30 seconds • No credit card needed</p>
            </div>
          ) : (
            /* No active journeys but has past journeys - show compact prompt */
            <div className="text-center py-8 animate-enter">
              <p className="text-zinc-500 mb-4">No active journeys right now</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Journey</span>
              </button>
            </div>
          )}
        </section>

        {/* Past Journeys / Archive */}
        {pastJourneys.length > 0 && (
          <section className="animate-enter delay-200" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Archive className="w-3.5 h-3.5 text-[var(--fg-subtle)]" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--fg-muted)]">Memory Vault</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[var(--border-base)] to-transparent ml-2" />
            </div>
            
            <div className="space-y-3">
              {filteredPastJourneys.map((journey) => (
                <button
                  key={journey.id}
                  onClick={() => isUnlocked(journey) && setSelectedJourney(journey)}
                  disabled={!isUnlocked(journey)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all relative overflow-hidden ${
                    isUnlocked(journey) 
                      ? 'bg-[var(--bg-hover)] hover:bg-[var(--bg-surface)] active:scale-[0.99]' 
                      : 'bg-[var(--bg-hover)]/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: getJourneyGradient(journey.name).gradient }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ background: getJourneyGradient(journey.name).gradient }}>
                    <div className="absolute inset-0 bg-black/30" />
                    {journey.emoji ? (
                      <span className="text-xl relative z-10">{journey.emoji}</span>
                    ) : isUnlocked(journey) ? (
                      <Sparkles className="w-5 h-5 text-white relative z-10" />
                    ) : (
                      <Lock className="w-4 h-4 text-white/60 relative z-10" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[var(--fg-base)] truncate">{journey.name}</h3>
                      {!isOwner(journey) && (
                        <Badge variant="info">Shared</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--fg-muted)]">
                      {isUnlocked(journey) 
                        ? `${journey.memory_count || 0} memories · ${formatDate(journey.unlock_date)}`
                        : `Unlocks in ${getTimeUntilUnlock(journey.unlock_date)}`
                      }
                    </p>
                  </div>
                  
                  {isUnlocked(journey) && <ChevronRight className="w-5 h-5 text-[var(--fg-subtle)]" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 pb-6 text-center space-y-3">
          <nav className="text-xs text-[var(--fg-subtle)]">
            <Link href="/privacy" className="hover:text-[var(--fg-muted)] transition-colors">Privacy</Link>
            <span className="mx-3 text-[var(--fg-subtle)]">•</span>
            <Link href="/terms" className="hover:text-[var(--fg-muted)] transition-colors">Terms</Link>
          </nav>
          <p className="text-[10px] text-[var(--fg-subtle)]">© {new Date().getFullYear()} Sunroof. All rights reserved.</p>
        </footer>
      </main>
      
      {/* Keyboard Shortcuts Help Modal (desktop only) */}
      {!isMobile && <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={closeShortcuts} />}
      
      {/* Action Sheet for journey actions (mobile-friendly) */}
      <ActionSheet
        isOpen={!!actionSheetJourney}
        onClose={() => setActionSheetJourney(null)}
        title={actionSheetJourney?.name}
        options={[
          {
            label: 'Capture Photo',
            icon: <Camera className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) onCapture?.(actionSheetJourney, 'photo'); },
          },
          {
            label: 'Record Voice',
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
            icon: <ImageIcon className="w-5 h-5" />,
            onClick: () => { if (actionSheetJourney) setManagingJourney(actionSheetJourney); },
          },
          {
            label: 'Invite Collaborator',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
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
