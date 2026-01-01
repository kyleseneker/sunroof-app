'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchPastJourneysWithCounts } from '@/lib/supabase-queries';
import { useAuth } from '@/lib/auth';
import { hapticSuccess } from '@/lib/haptics';
import { api } from '@/lib/api/client';
import { Plus, ArrowRight, MapPin, X, Lock, ChevronRight, ChevronLeft, Sparkles, Trash2, HelpCircle, Camera, Clock, ImageIcon, Pencil, FileText, Download, ArrowUpDown, Copy, Check, Share, Plane, Timer, Archive, UserPlus, Users, Loader2, Search, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import GalleryView from './GalleryView';
import Avatar from './Avatar';
import { KeyboardShortcutsHelp, useKeyboardShortcutsHelp } from './KeyboardShortcuts';
import MemoryBadge from './MemoryBadge';
import ActionSheet from './ActionSheet';
import Image from 'next/image';
import Link from 'next/link';
import { getJourneyGradient } from '@/lib/utils/gradients';
import { DESTINATION_SUGGESTIONS } from '@/lib/constants';
import type { Journey } from '@/types';

export default function Dashboard({ activeJourneys: initialActiveJourneys = [], onCapture }: { activeJourneys?: Journey[], onCapture?: (journey: Journey) => void }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>(initialActiveJourneys);
  
  // Sync with prop updates (e.g., after returning from camera)
  useEffect(() => {
    setActiveJourneys(initialActiveJourneys);
  }, [initialActiveJourneys]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [tripName, setTripName] = useState('');
  const [unlockDays, setUnlockDays] = useState<number | null>(3);
  const [customDate, setCustomDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [pastJourneys, setPastJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [focusedJourney, setFocusedJourney] = useState<Journey | null>(null);
  const [managingMemories, setManagingMemories] = useState<Journey | null>(null);
  const [lockedMemories, setLockedMemories] = useState<any[]>([]);
  const [memoryToDelete, setMemoryToDelete] = useState<any | null>(null);
  const [loadingMemories, setLoadingMemories] = useState(false);
  
  // Invite collaborator state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [journeyToShare, setJourneyToShare] = useState<Journey | null>(null);
  
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
  
  // Share during creation state
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [shareEmailInput, setShareEmailInput] = useState('');
  
  // Collaborator emails cache (user_id -> email)
  const [collaboratorEmails, setCollaboratorEmails] = useState<Record<string, string>>({});
  
  // Keyboard shortcuts help modal (desktop only)
  const { isOpen: showShortcuts, close: closeShortcuts } = useKeyboardShortcutsHelp();
  
  // Action sheet for journey actions (mobile-friendly)
  const [actionSheetJourney, setActionSheetJourney] = useState<Journey | null>(null);
  
  // Detect if user is on mobile (no hover, touch device)
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

  // Random destination placeholder (changes each time modal opens)
  const destinationPlaceholder = useMemo(() => {
    return DESTINATION_SUGGESTIONS[Math.floor(Math.random() * DESTINATION_SUGGESTIONS.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreating]);

  // Fetch locked memories for management (without content)
  const fetchLockedMemories = async (journeyId: string) => {
    setLoadingMemories(true);
    const { data } = await supabase
      .from('memories')
      .select('id, type, created_at')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false });
    setLockedMemories(data || []);
    setLoadingMemories(false);
  };

  // Delete a single memory
  const [isDeletingMemory, setIsDeletingMemory] = useState(false);
  
  const handleDeleteLockedMemory = async (memoryId: string) => {
    if (isDeletingMemory) return; // Prevent double-click
    setIsDeletingMemory(true);
    
    try {
      const { error } = await supabase.from('memories').delete().eq('id', memoryId);
      
      if (error) {
        showToast('Failed to delete memory', 'error');
        setIsDeletingMemory(false);
        return;
      }
      
      setLockedMemories(lockedMemories.filter(m => m.id !== memoryId));
      setMemoryToDelete(null);
      
      // Update the focused journey's memory count
      if (focusedJourney) {
        const newCount = Math.max(0, (focusedJourney.memory_count || 1) - 1);
        setFocusedJourney({
          ...focusedJourney,
          memory_count: newCount
        });
        
        // Also update the activeJourneys list
        setActiveJourneys(activeJourneys.map(j => 
          j.id === focusedJourney.id 
            ? { ...j, memory_count: newCount }
            : j
        ));
      }
      
      hapticSuccess();
      showToast('Memory deleted', 'success');
    } catch (err) {
      console.error('Delete memory error:', err);
      showToast('Something went wrong', 'error');
    } finally {
      setIsDeletingMemory(false);
    }
  };

  // Fetch past/completed journeys with memory counts (optimized - single query for counts)
  const fetchPastJourneys = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await fetchPastJourneysWithCounts(user.id);
    
    if (error) {
      console.error('Error fetching past journeys:', error);
      return;
    }
    
    setPastJourneys(data || []);
  }, [user]);

  useEffect(() => {
    fetchPastJourneys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim and validate trip name
    const cleanName = tripName.trim();
    if (!cleanName) {
      showToast('Please enter a destination', 'error');
      return;
    }
    if (cleanName.length > 50) {
      showToast('Destination name is too long (max 50 characters)', 'error');
      return;
    }
    if (!unlockDays && !customDate) {
      showToast('Please select an unlock date', 'error');
      return;
    }
    
    setLoading(true);

    let unlockDate: Date;
    if (customDate) {
      unlockDate = new Date(customDate);
      // Ensure it's set to end of day in local timezone
      unlockDate.setHours(23, 59, 59, 999);
    } else {
      // Add exactly N days (N * 24 hours) from now
      // This ensures "3 days" means approximately 72 hours, not 72h minus hours already elapsed today
      unlockDate = new Date();
      unlockDate.setTime(unlockDate.getTime() + (unlockDays || 3) * 24 * 60 * 60 * 1000);
    }

    // Validate unlock date is in the future
    if (unlockDate <= new Date()) {
      showToast('Unlock date must be in the future', 'error');
      setLoading(false);
      return;
    }

    try {
      // Resolve share emails to user IDs
      const sharedWithIds: string[] = [];
      if (shareEmails.length > 0) {
        for (const email of shareEmails) {
          const { data, error } = await supabase.rpc('get_user_id_by_email', { email_input: email });
          if (!error && data) {
            sharedWithIds.push(data);
          }
          // If user not found, skip silently (they may not have signed up yet)
        }
      }

      // Note: cover_url is no longer stored - gradients are generated dynamically from journey name
      const { error } = await supabase.from('journeys').insert([{
        name: cleanName,
      unlock_date: unlockDate.toISOString(),
        status: 'active',
        user_id: user?.id,
        shared_with: sharedWithIds.length > 0 ? sharedWithIds : null
      }]);

      if (error) {
        console.error('Create journey error:', error);
        showToast('Couldn\'t create journey. Check your connection and try again.', 'error');
        setLoading(false);
      } else {
        const shareMsg = sharedWithIds.length > 0 
          ? ` Shared with ${sharedWithIds.length} ${sharedWithIds.length === 1 ? 'person' : 'people'}.`
          : '';
        const skippedCount = shareEmails.length - sharedWithIds.length;
        const skipMsg = skippedCount > 0 
          ? ` (${skippedCount} email${skippedCount > 1 ? 's' : ''} not found)`
          : '';
        hapticSuccess();
        showToast(`${cleanName} created!${shareMsg}${skipMsg}`, 'success');
        
        // Reset share state
        setShareEmails([]);
        setShareEmailInput('');
        
        window.location.reload();
      }
    } catch (err) {
      console.error('Create journey exception:', err);
      showToast('Something went wrong. Please try again.', 'error');
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeUntilUnlock = (unlockDate: string) => {
    const now = new Date();
    const unlock = new Date(unlockDate);
    const diffMs = unlock.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Ready';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  const isUnlocked = (journey: Journey) => {
    return new Date(journey.unlock_date) <= new Date() || journey.status === 'completed';
  };

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Max active journeys limit
  const MAX_ACTIVE_JOURNEYS = 10;
  const canCreateJourney = activeJourneys.length < MAX_ACTIVE_JOURNEYS;
  
  // Auto-close search when no journeys exist
  useEffect(() => {
    if (activeJourneys.length === 0 && pastJourneys.length === 0) {
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [activeJourneys.length, pastJourneys.length]);

  // Global escape key handler - close modals/overlays
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close in priority order (most "on top" first)
        if (memoryToDelete) {
          setMemoryToDelete(null);
        } else if (showInviteModal) {
          setShowInviteModal(false);
          setInviteEmail('');
          setJourneyToShare(null);
        } else if (deleteConfirm) {
          setDeleteConfirm(null);
        } else if (editingJourney) {
          setEditingJourney(null);
        } else if (managingMemories) {
          setManagingMemories(null);
          setLockedMemories([]);
        } else if (focusedJourney) {
          setFocusedJourney(null);
        } else if (selectedJourney) {
          setSelectedJourney(null);
        } else if (isCreating) {
          setIsCreating(false);
          setShareEmails([]);
          setShareEmailInput('');
        } else if (showHelp) {
          setShowHelp(false);
        } else if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [memoryToDelete, showInviteModal, deleteConfirm, editingJourney, managingMemories, focusedJourney, selectedJourney, isCreating, showHelp, showSearch]);

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
    // Parent component handles active journeys refresh
    setTimeout(() => setIsRefreshing(false), 800);
  }, [fetchPastJourneys]);

  // Set up non-passive touch events for pull-to-refresh
  useEffect(() => {
    const element = mainRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when scrolled to top (or near top)
      if (element.scrollTop <= 5) {
        pullStartY.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY.current;
      
      // Only activate if pulling down while at/near top
      if (diff > 0 && element.scrollTop <= 5) {
        // Prevent native scroll while we're handling pull-to-refresh
        e.preventDefault();
        // Apply resistance to make it feel natural
        const resistance = 0.4;
        const newDistance = Math.min(diff * resistance, PULL_THRESHOLD * 1.5);
        pullDistanceRef.current = newDistance;
        setPullDistance(newDistance);
      } else if (diff <= 0) {
        // User is scrolling up, cancel pull-to-refresh
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

    // Use non-passive listeners to allow preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, handleRefresh]);

  // Check if current user owns this journey
  const isOwner = (journey: Journey) => journey.user_id === user?.id;

  // Fetch collaborator emails when focused journey changes
  useEffect(() => {
    const fetchCollaboratorEmails = async () => {
      if (!focusedJourney?.shared_with?.length) return;
      
      const unknownIds = focusedJourney.shared_with.filter(id => !collaboratorEmails[id]);
      if (unknownIds.length === 0) return;
      
      for (const id of unknownIds) {
        const { data, error } = await supabase.rpc('get_email_by_user_id', { user_id_input: id });
        if (!error && data) {
          setCollaboratorEmails(prev => ({ ...prev, [id]: data }));
        }
      }
    };
    
    fetchCollaboratorEmails();
  }, [focusedJourney?.shared_with, collaboratorEmails]);

  // Remove a collaborator from a journey
  const handleRemoveCollaborator = async (journeyId: string, userIdToRemove: string) => {
    const journey = activeJourneys.find(j => j.id === journeyId) || pastJourneys.find(j => j.id === journeyId);
    if (!journey) return;
    
    const updatedSharedWith = (journey.shared_with || []).filter(id => id !== userIdToRemove);
    
    const { error } = await supabase
      .from('journeys')
      .update({ shared_with: updatedSharedWith.length > 0 ? updatedSharedWith : null })
      .eq('id', journeyId);
    
    if (error) {
      showToast('Failed to remove collaborator', 'error');
      return;
    }
    
    // Update local state
    const updateJourney = (j: Journey) => 
      j.id === journeyId ? { ...j, shared_with: updatedSharedWith.length > 0 ? updatedSharedWith : undefined } : j;
    
    setActiveJourneys(prev => prev.map(updateJourney));
    setPastJourneys(prev => prev.map(updateJourney));
    if (focusedJourney?.id === journeyId) {
      setFocusedJourney({ ...focusedJourney, shared_with: updatedSharedWith.length > 0 ? updatedSharedWith : undefined });
    }
    
    hapticSuccess();
    showToast('Collaborator removed', 'success');
  };

  // Handle inviting a collaborator
  const handleInviteCollaborator = async () => {
    if (!journeyToShare || !inviteEmail.trim()) return;
    
    setInviteLoading(true);
    
    try {
      // Look up user by email using Supabase Admin API workaround
      // We'll store the email and resolve it when they sign in
      // For now, we'll check if they exist in our journeys (meaning they've used the app)
      
      // First, check if this email is already shared
      const currentShared = journeyToShare.shared_with || [];
      
      // Get user ID from email (using auth.users is restricted, so we use a different approach)
      // We'll use a custom RPC or just store emails for now
      const { data: existingUser, error: lookupError } = await supabase.rpc('get_user_id_by_email', {
        email_input: inviteEmail.trim().toLowerCase()
      });
      
      if (lookupError) {
        // If RPC doesn't exist, show a helpful message
        if (lookupError.message.includes('function') || lookupError.message.includes('does not exist')) {
          showToast('Sharing feature requires database setup. See console for SQL.', 'error');
          console.log(`
-- Run this SQL in Supabase to enable email lookup:
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS UUID AS $$
  SELECT id FROM auth.users WHERE email = email_input LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
          `);
          setInviteLoading(false);
          return;
        }
        showToast('Failed to find user', 'error');
        setInviteLoading(false);
        return;
      }
      
      if (!existingUser) {
        showToast('No account found. They\'ll need to sign up first.', 'error');
        setInviteLoading(false);
        return;
      }
      
      // Check if already shared
      if (currentShared.includes(existingUser)) {
        showToast('Already shared with this person', 'error');
        setInviteLoading(false);
        return;
      }
      
      // Add to shared_with array
      const { error: updateError } = await supabase
        .from('journeys')
        .update({ shared_with: [...currentShared, existingUser] })
        .eq('id', journeyToShare.id);
      
      if (updateError) {
        showToast('Failed to share journey', 'error');
        setInviteLoading(false);
        return;
      }
      
      hapticSuccess();
      showToast(`Shared with ${inviteEmail}!`, 'success');
      setShowInviteModal(false);
      setInviteEmail('');
      setJourneyToShare(null);
      
      // Update local state
      setActiveJourneys(prev => prev.map(j => 
        j.id === journeyToShare.id 
          ? { ...j, shared_with: [...currentShared, existingUser] }
          : j
      ));
      if (focusedJourney?.id === journeyToShare.id) {
        setFocusedJourney({ ...focusedJourney, shared_with: [...currentShared, existingUser] });
      }
    } catch (err) {
      console.error('Invite error:', err);
      showToast('Failed to invite collaborator', 'error');
    }
    
    setInviteLoading(false);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteJourney = async (journeyId: string) => {
    if (isDeleting) return; // Prevent double-click
    setIsDeleting(true);
    
    try {
      // Delete all memories for this journey first
      await supabase.from('memories').delete().eq('journey_id', journeyId);
      // Then delete the journey
      const { error } = await supabase.from('journeys').delete().eq('id', journeyId);
      
      if (error) {
        showToast('Failed to delete journey', 'error');
        setIsDeleting(false);
        return;
      }
      
      hapticSuccess();
      showToast('Journey deleted', 'success');
      window.location.reload();
    } catch (err) {
      console.error('Delete journey error:', err);
      showToast('Something went wrong', 'error');
      setIsDeleting(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleEditJourney = async () => {
    if (!editingJourney || !editName.trim() || isSaving) return;
    
    const cleanName = editName.trim();
    if (cleanName.length > 50) {
      showToast('Name is too long (max 50 characters)', 'error');
      return;
    }
    
    setIsSaving(true);
    
    const updates: any = { name: cleanName };
    if (editDate) {
      const newDate = new Date(editDate);
      newDate.setHours(23, 59, 59, 999);
      
      // Only validate future date for active journeys
      if (editingJourney.status === 'active' && newDate <= new Date()) {
        showToast('Unlock date must be in the future', 'error');
        setIsSaving(false);
        return;
      }
      
      updates.unlock_date = newDate.toISOString();
    }
    
    try {
      const { error } = await supabase
        .from('journeys')
        .update(updates)
        .eq('id', editingJourney.id);
      
      if (error) {
        console.error('Edit journey error:', error);
        showToast('Failed to update journey', 'error');
        setIsSaving(false);
        return;
      }
      
      hapticSuccess();
      showToast('Journey updated!', 'success');
      window.location.reload();
    } catch (err) {
      console.error('Edit journey exception:', err);
      showToast('Something went wrong', 'error');
      setIsSaving(false);
    }
  };

  const openEditModal = (journey: Journey) => {
    setEditingJourney(journey);
    setEditName(journey.name);
    setEditDate(journey.unlock_date.split('T')[0]);
  };

  // --- CREATE MODAL ---
  if (isCreating) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col safe-top safe-bottom">
        <div className="flex-1 flex flex-col p-6 animate-enter">
          <button 
            onClick={() => {
              setIsCreating(false);
              setShareEmails([]);
              setShareEmailInput('');
            }} 
            className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-white/5 mb-8"
          >
            <X className="w-5 h-5 text-white/60" />
        </button>
        
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                <Plane className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-3xl font-light tracking-tight text-white">New Journey</h2>
            </div>
            <p className="text-zinc-500 text-sm mb-10 ml-[60px]">Where are you headed?</p>
            
            <form onSubmit={handleCreate} className="space-y-8">
          <div>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">
                  <MapPin className="w-3 h-3" />
                  Destination
                </label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder={destinationPlaceholder}
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-orange-400 rounded-2xl px-5 py-4 text-2xl font-light text-white placeholder:text-zinc-600 focus:outline-none focus:bg-black/50 transition-all input-premium"
                />
          </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">
                  <Timer className="w-3 h-3" />
                  Unlock After
                </label>
                <div className="flex gap-2 mb-3">
                  {[3, 5, 7, 14].map((days) => {
                    const isSelected = unlockDays === days && !customDate;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setUnlockDays(days);
                          setCustomDate('');
                        }}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-white text-black' 
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {days}d
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600">or</span>
                  <input
                    type="date"
                    value={customDate}
                    onFocus={() => setUnlockDays(null)}
                    onInput={() => setUnlockDays(null)}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (selectedDate >= today) {
                        setCustomDate(e.target.value);
                        setUnlockDays(null);
                      } else {
                        // Reset to empty if past date
                        setCustomDate('');
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all bg-zinc-900 border-2 ${
                      customDate 
                        ? 'border-white text-white' 
                        : 'border-transparent text-zinc-500'
                    }`}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Share With (Optional) */}
              <div>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">
                  <UserPlus className="w-3 h-3" />
                  Share With <span className="text-zinc-700 normal-case tracking-normal">(optional)</span>
                </label>
                
                {/* Added emails */}
                {shareEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {shareEmails.map((email, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => setShareEmails(shareEmails.filter((_, idx) => idx !== i))}
                          className="hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input 
                    type="email"
                    placeholder="friend@email.com"
                    value={shareEmailInput}
                    onChange={(e) => setShareEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const email = shareEmailInput.trim().toLowerCase();
                        if (email && email.includes('@') && !shareEmails.includes(email)) {
                          setShareEmails([...shareEmails, email]);
                          setShareEmailInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const email = shareEmailInput.trim().toLowerCase();
                      if (email && email.includes('@') && !shareEmails.includes(email)) {
                        setShareEmails([...shareEmails, email]);
                        setShareEmailInput('');
                      }
                    }}
                    disabled={!shareEmailInput.trim() || !shareEmailInput.includes('@')}
                    className="px-4 py-3 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  They'll be invited when the journey is created
                </p>
              </div>
              
              <button 
                type="submit"
                disabled={loading || !tripName}
                className="w-full h-14 bg-white text-black rounded-full font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 active:scale-[0.98] transition-all mt-4"
              >
                {loading ? 'Creating...' : 'Start Journey'}
          </button>
        </form>
          </div>
        </div>
      </div>
    );
  }

  // --- MANAGE LOCKED MEMORIES VIEW ---
  if (managingMemories) {
  return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col safe-top safe-bottom">
        {/* Header */}
        <header className="flex items-center gap-4 p-6 border-b border-zinc-900">
          <button 
            onClick={() => {
              setManagingMemories(null);
              setLockedMemories([]);
            }}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-medium">Manage Memories</h1>
            <p className="text-xs text-zinc-500">{managingMemories.name} • {lockedMemories.length} memories</p>
          </div>
      </header>

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingMemories ? (
            /* Skeleton loader for memories */
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded skeleton" />
                    <div className="h-3 w-16 rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : lockedMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-zinc-500">No memories captured yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lockedMemories.map((memory, i) => {
                const memoryDate = new Date(memory.created_at);
                const formattedDate = memoryDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                });
                return (
                  <div 
                    key={memory.id}
                    className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl animate-enter"
                    style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                        {memory.type === 'photo' ? (
                          <ImageIcon className="w-5 h-5 text-zinc-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {memory.type === 'photo' ? 'Photo' : 'Note'}
                        </p>
                        <p className="text-xs text-zinc-500">{formattedDate}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMemoryToDelete(memory)}
                      className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Memory Confirmation */}
        {memoryToDelete && (
          <div 
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setMemoryToDelete(null)}
          >
            <div 
              className="w-full max-w-sm bg-zinc-900 rounded-3xl p-6 animate-enter"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Delete this memory?</h3>
              <p className="text-zinc-500 text-sm text-center mb-6">
                This {memoryToDelete.type === 'photo' ? 'photo' : 'note'} will be permanently deleted. You won't be able to recover it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMemoryToDelete(null)}
                  className="flex-1 h-12 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteLockedMemory(memoryToDelete.id)}
                  disabled={isDeletingMemory}
                  className="flex-1 h-12 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingMemory ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- INVITE COLLABORATOR MODAL (must be before focusedJourney check) ---
  if (showInviteModal && journeyToShare) {
    return (
      <div 
        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 safe-top safe-bottom"
        onClick={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setJourneyToShare(null);
        }}
      >
        <div 
          className="glass rounded-2xl p-6 max-w-sm w-full animate-enter border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-medium">Share Journey</h2>
            </div>
            <button 
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
              }}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-zinc-500 mb-4">
            Invite someone to contribute to <span className="text-white">{journeyToShare.name}</span>. 
            They&apos;ll be able to add memories and see the journey unlock.
          </p>
          
          {/* Current collaborators */}
          {(journeyToShare.shared_with?.length || 0) > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-white/5">
              <p className="text-xs text-zinc-500 mb-2">Already shared with:</p>
              <div className="flex flex-wrap gap-2">
                {journeyToShare.shared_with?.map((userId, i) => (
                  <div key={i} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                    Collaborator {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleInviteCollaborator(); }}>
            <input
              type="email"
              placeholder="Enter their email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full h-12 px-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
                className="flex-1 h-12 bg-white/5 rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inviteEmail.trim() || inviteLoading}
                className="flex-1 h-12 bg-blue-500 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                {inviteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- FOCUSED JOURNEY VIEW (for active journeys) ---
  if (focusedJourney) {
    const countdown = getTimeUntilUnlock(focusedJourney.unlock_date);
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col safe-top safe-bottom">
        {/* Dynamic gradient background */}
        <div 
          className="absolute inset-0"
          style={{ background: getJourneyGradient(focusedJourney.name).gradient }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 40%),
                              radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 40%)`
          }}
        />
        
        {/* Top Bar */}
        <div className="relative z-10 flex justify-between items-center p-6">
          <button 
            onClick={() => setFocusedJourney(null)} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/20 hover:border-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {/* Owner-only actions */}
          {isOwner(focusedJourney) && (
            <div className="flex gap-2">
              {/* Share button */}
              <button
                onClick={() => {
                  setJourneyToShare(focusedJourney);
                  setShowInviteModal(true);
                }}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 hover:border-white/20 active:scale-95 transition-all cursor-pointer"
                title="Share journey"
              >
                <UserPlus className="w-4 h-4 text-white" />
              </button>
              {/* Edit button */}
              <button
                onClick={() => {
                  setFocusedJourney(null);
                  openEditModal(focusedJourney);
                }}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 hover:border-white/20 active:scale-95 transition-all cursor-pointer"
                title="Edit journey"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>
              {/* Delete button */}
              <button
                onClick={() => {
                  setFocusedJourney(null);
                  setDeleteConfirm(focusedJourney.id);
                }}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-red-500/30 hover:border-red-500/30 active:scale-95 transition-all cursor-pointer"
                title="Delete journey"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-12">
          {/* Locked indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">Locked</span>
          </div>
          
          {/* Journey Name */}
          <h1 className="text-4xl font-bold mb-2">{focusedJourney.name}</h1>
          
          {/* Memory count with manage link */}
          <button 
            onClick={() => {
              setManagingMemories(focusedJourney);
              fetchLockedMemories(focusedJourney.id);
            }}
            className="text-zinc-400 mb-4 flex items-center gap-2 hover:text-white transition-colors"
          >
            <span>{focusedJourney.memory_count || 0} {(focusedJourney.memory_count || 0) === 1 ? 'memory' : 'memories'} captured</span>
            {(focusedJourney.memory_count || 0) > 0 && (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {/* Shared with indicator */}
          {(focusedJourney.shared_with?.length || 0) > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 text-zinc-500 mb-3">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  Shared with {focusedJourney.shared_with?.length} {focusedJourney.shared_with?.length === 1 ? 'person' : 'people'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {focusedJourney.shared_with?.map(userId => (
                  <div 
                    key={userId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50"
                  >
                    <span className="text-sm text-zinc-300">
                      {collaboratorEmails[userId] || 'Loading...'}
                    </span>
                    {isOwner(focusedJourney) && (
                      <button
                        onClick={() => handleRemoveCollaborator(focusedJourney.id, userId)}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-colors"
                        title="Remove collaborator"
                      >
                        <X className="w-3 h-3 text-zinc-500 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!focusedJourney.shared_with?.length && <div className="mb-4" />}
          
          {/* Countdown */}
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Unlocks in</p>
            </div>
            <p className="text-4xl font-light tracking-wide">{countdown}</p>
          </div>
          
          {/* Capture Button */}
          <button
            onClick={() => {
              setFocusedJourney(null);
              onCapture?.(focusedJourney);
            }}
            className="w-full h-16 rounded-full bg-gradient-to-r from-white to-zinc-100 text-black font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-xl shadow-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            Capture Memory
          </button>
        </div>
      </div>
    );
  }

  // --- GALLERY VIEW (for unlocked journeys) ---
  if (selectedJourney) {
    return (
      <GalleryView 
        journey={selectedJourney} 
        onClose={() => setSelectedJourney(null)}
        onMemoryDeleted={() => {
          // Update the memory count in pastJourneys
          setPastJourneys(pastJourneys.map(j => 
            j.id === selectedJourney.id 
              ? { ...j, memory_count: Math.max(0, (j.memory_count || 1) - 1) }
              : j
          ));
        }}
      />
    );
  }

  // --- HELP MODAL ---
  if (showHelp) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col safe-top safe-bottom">
        <div className="flex-1 flex flex-col p-6 animate-enter overflow-y-auto">
          <button 
            onClick={() => setShowHelp(false)} 
            className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-white/5 mb-6"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          
          <div className="max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
              <Image src="/icon.svg" alt="Sunroof" width={32} height={32} />
              <h2 className="text-2xl font-light">How Sunroof Works</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
             <div>
                  <h3 className="font-medium mb-1">1. Start a Journey</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Create a new journey before you go. Choose when your memories unlock.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">2. Capture Moments</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Take photos and write notes during your journey. They go straight to the vault, no peeking!
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">3. Wait for Unlock</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Your memories stay hidden until the timer expires. Stay present and enjoy the moment.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">4. Relive the Magic</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    When time&apos;s up, open your vault and rediscover your journey. It&apos;s like developing film!
                  </p>
                </div>
              </div>
             </div>

             <button 
              onClick={() => setShowHelp(false)}
              className="w-full h-14 bg-white text-black rounded-full font-semibold text-sm mt-10"
             >
              Got it
             </button>
          </div>
        </div>
      </div>
    );
  }

  // --- EDIT JOURNEY MODAL ---
  if (editingJourney) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col safe-top safe-bottom">
        <div className="flex-1 flex flex-col p-6 animate-enter">
          <button 
            onClick={() => setEditingJourney(null)} 
            className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-white/5 mb-6"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <h2 className="text-3xl font-light tracking-tight text-white mb-8">Edit Journey</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 block">
                  Name
                </label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-zinc-900 rounded-xl py-3 px-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              
              <div>
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 block">
                  Unlock Date
                </label>
                <input 
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-zinc-900 rounded-xl py-3 px-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              
              <button 
                onClick={handleEditJourney}
                disabled={!editName.trim() || isSaving}
                className="w-full h-14 bg-white text-black rounded-full font-semibold text-sm disabled:opacity-40 mt-4"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DELETE CONFIRMATION MODAL ---
  if (deleteConfirm) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={() => setDeleteConfirm(null)}
      >
        <div 
          className="w-full max-w-sm bg-zinc-900 rounded-3xl p-6 animate-enter"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Delete Journey?</h3>
          <p className="text-zinc-500 text-sm text-center mb-6">
            This will permanently delete this journey and all its memories. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 h-12 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteJourney(deleteConfirm)}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-[100dvh] flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex justify-between items-center p-6 pb-4">
        <div className="flex items-center gap-2">
          <Image src="/icon.svg" alt="Sunroof" width={22} height={22} />
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-zinc-500">Sunroof</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Button - only show if there are journeys to search */}
          {(activeJourneys.length > 0 || pastJourneys.length > 0) && (
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer ${showSearch ? 'bg-white/10' : 'bg-white/5'}`}
            >
              <Search className="w-4 h-4 text-zinc-500" />
            </button>
          )}
          <button 
            onClick={() => setShowHelp(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-zinc-500" />
          </button>
          <button 
            onClick={() => {
              if (canCreateJourney) {
                setIsCreating(true);
              } else {
                showToast(`Maximum ${MAX_ACTIVE_JOURNEYS} active journeys allowed`, 'error');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search journeys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-10 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-zinc-500 mt-2">
              Found {filteredActiveJourneys.length + filteredPastJourneys.length} {(filteredActiveJourneys.length + filteredPastJourneys.length) === 1 ? 'journey' : 'journeys'}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
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
            className={`w-5 h-5 text-zinc-500 transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`} 
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)` 
            }}
          />
          <span className="text-sm text-zinc-500">
            {isRefreshing ? 'Refreshing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      <main 
        ref={mainRef}
        className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-hide overscroll-contain"
      >
        
        {/* Welcome Section */}
        {(activeJourneys.length > 0 || pastJourneys.length > 0) && (
          <div className="mb-8 animate-enter">
            {/* Greeting */}
            <h1 className="text-2xl font-light mb-1">
              {getGreeting()}, <span className="text-white">{user?.user_metadata?.display_name?.split(' ')[0] || 'traveler'}</span>
            </h1>
            
            {/* Contextual subtitle */}
            <p className="text-zinc-500 text-sm mb-4">
              {activeJourneys.length > 0 
                ? `You have ${activeJourneys.length} ${activeJourneys.length === 1 ? 'journey' : 'journeys'} in progress`
                : pastJourneys.length > 0 
                  ? 'Ready to start a new adventure?'
                  : 'Welcome to Sunroof'
              }
            </p>
            
            {/* Quick Stats Row */}
            {(activeJourneys.length > 0 || pastJourneys.length > 0) && (
              <div className="flex gap-3">
                {/* Total Memories */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-xs text-zinc-400">
                    {activeJourneys.reduce((sum, j) => sum + (j.memory_count || 0), 0) + 
                     pastJourneys.reduce((sum, j) => sum + (j.memory_count || 0), 0)} memories
                  </span>
                </div>
                
                {/* Next Unlock */}
                {activeJourneys.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-zinc-400">
                      Next unlock: {getTimeUntilUnlock(
                        [...activeJourneys].sort((a, b) => 
                          new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime()
                        )[0].unlock_date
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
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
                    className="relative w-full glass rounded-[28px] p-6 overflow-hidden border border-white/10 cursor-pointer card-glow active:scale-[0.98] transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Dynamic gradient background based on journey name */}
                    <div 
                      className="absolute inset-0"
                      style={{ background: getJourneyGradient(journey.name).gradient }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Subtle pattern overlay for texture */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.08) 0%, transparent 50%)`
                      }}
                    />
                    
                    <div className="relative z-10 flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                            Unlocks in {getTimeUntilUnlock(journey.unlock_date)}
                          </p>
                          {/* Shared indicator for collaborators */}
                          {!isOwner(journey) && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                              Shared
                            </span>
                          )}
                        </div>
                        {(journey.memory_count ?? 0) > 0 && (
                          <div className="mt-1">
                            <MemoryBadge 
                              count={journey.memory_count ?? 0} 
                              isLocked={true}
                              variant="compact"
                            />
                          </div>
                        )}
                      </div>
                      {/* Owner-only action buttons - show inline on desktop, menu button on mobile */}
                      {isOwner(journey) && (
                        isMobile ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionSheetJourney(journey); }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
                            aria-label="Journey options"
                          >
                            <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(journey); }}
                              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(journey.id); }}
                              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    <div className="relative z-10">
                      <h2 className="text-3xl font-light tracking-tight mb-4 break-words">{journey.name}</h2>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onCapture?.(journey); }}
                        className="group w-full h-12 bg-white text-black rounded-full font-semibold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-zinc-100 active:scale-[0.98] transition-all btn-shine shadow-lg shadow-white/10"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Memory
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 animate-enter">
              {/* Premium empty state illustration */}
              <div className="relative w-40 h-40 mx-auto mb-8 empty-illustration">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-500/20 animate-breathe" />
                
                {/* Main circle */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center shadow-2xl">
                  <div className="relative">
                    <Camera className="w-10 h-10 text-zinc-500" />
                    {/* Sparkle accents */}
                    <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-orange-400 animate-pulse" />
                  </div>
                </div>
                
                {/* Floating decorative elements */}
                <div className="absolute top-2 right-6 w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 animate-float" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 -right-2 w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 animate-float" style={{ animationDelay: '1s' }} />
              </div>
              
              <h2 className="text-3xl font-light text-white mb-3">
                Ready for an adventure?
              </h2>
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
              
              <p className="mt-6 text-xs text-zinc-600">
                Takes 30 seconds • No credit card needed
              </p>
          </div>
        )}
        </section>

        {/* Past Journeys / Archive */}
        {pastJourneys.length > 0 && (
          <section className="animate-enter delay-200" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Archive className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">Memory Vault</span>
              <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent ml-2" />
            </div>
            
            <div className="space-y-3">
              {filteredPastJourneys.map((journey) => (
                <button
                  key={journey.id}
                  onClick={() => isUnlocked(journey) && setSelectedJourney(journey)}
                  disabled={!isUnlocked(journey)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all relative overflow-hidden ${
                    isUnlocked(journey) 
                      ? 'bg-zinc-900/50 hover:bg-zinc-800/50 active:scale-[0.99]' 
                      : 'bg-zinc-900/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Subtle gradient accent on left edge */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: getJourneyGradient(journey.name).gradient }}
                  />
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{ background: getJourneyGradient(journey.name).gradient }}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    {isUnlocked(journey) ? (
                      <Sparkles className="w-5 h-5 text-white relative z-10" />
                    ) : (
                      <Lock className="w-4 h-4 text-white/60 relative z-10" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">{journey.name}</h3>
                      {!isOwner(journey) && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium shrink-0">
                          Shared
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {isUnlocked(journey) 
                        ? `${journey.memory_count || 0} memories · ${formatDate(journey.unlock_date)}`
                        : `Unlocks in ${getTimeUntilUnlock(journey.unlock_date)}`
                      }
                    </p>
                  </div>
                  
                  {isUnlocked(journey) && (
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Footer with Legal Links */}
        <footer className="mt-8 pb-6 text-center space-y-3">
          <nav className="text-xs text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
              Privacy
            </Link>
            <span className="mx-3 text-zinc-700">•</span>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">
              Terms
            </Link>
            <span className="mx-3 text-zinc-700">•</span>
            <Link href="/settings" className="hover:text-zinc-400 transition-colors">
              Settings
            </Link>
          </nav>
          <p className="text-[10px] text-zinc-700">
            © {new Date().getFullYear()} Sunroof. All rights reserved.
          </p>
        </footer>
      </main>
      
      {/* Keyboard Shortcuts Help Modal (desktop only) */}
      {!isMobile && (
        <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={closeShortcuts} />
      )}
      
      {/* Action Sheet for journey actions (mobile-friendly) */}
      <ActionSheet
        isOpen={!!actionSheetJourney}
        onClose={() => setActionSheetJourney(null)}
        title={actionSheetJourney?.name}
        options={[
          {
            label: 'Capture Memory',
            icon: <Camera className="w-5 h-5" />,
            onClick: () => {
              if (actionSheetJourney) onCapture?.(actionSheetJourney);
            },
          },
          {
            label: 'Edit Journey',
            icon: <Pencil className="w-5 h-5" />,
            onClick: () => {
              if (actionSheetJourney) openEditModal(actionSheetJourney);
            },
          },
          {
            label: 'Manage Memories',
            icon: <ImageIcon className="w-5 h-5" />,
            onClick: () => {
              if (actionSheetJourney) {
                setManagingMemories(actionSheetJourney);
                fetchLockedMemories(actionSheetJourney.id);
              }
            },
          },
          {
            label: 'Invite Collaborator',
            icon: <UserPlus className="w-5 h-5" />,
            onClick: () => {
              if (actionSheetJourney) {
                setJourneyToShare(actionSheetJourney);
                setShowInviteModal(true);
              }
            },
          },
          {
            label: 'Delete Journey',
            icon: <Trash2 className="w-5 h-5" />,
            variant: 'danger',
            onClick: () => {
              if (actionSheetJourney) setDeleteConfirm(actionSheetJourney.id);
            },
          },
        ]}
      />
    </div>
  );
}
