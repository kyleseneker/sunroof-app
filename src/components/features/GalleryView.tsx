'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api, getJourneyGradient, ErrorMessages, formatDate } from '@/lib';
import { deleteJourney, deleteMemory, fetchMemoriesForJourney } from '@/services';
import { X, Trash2, Camera, Sparkles, Play, ChevronDown, Quote, Pencil, MoreVertical } from 'lucide-react';
import { useToast, ConfirmDialog, IconButton } from '@/components/ui';
import { AudioPlayer, MemoryViewer, AIRecapSheet, EditJourneyModal, ActionSheet } from '@/components/features';
import type { Journey, Memory } from '@/types';

interface GalleryViewProps {
  journey: Journey;
  onClose: () => void;
  onMemoryDeleted?: () => void;
  onJourneyUpdated?: (journey: Journey) => void;
}

export default function GalleryView({ journey: initialJourney, onClose, onMemoryDeleted, onJourneyUpdated }: GalleryViewProps) {
  const [journey, setJourney] = useState<Journey>(initialJourney);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const { showToast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [showDeleteJourneyConfirm, setShowDeleteJourneyConfirm] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; color: string; delay: number }>>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Recap state
  const [showRecap, setShowRecap] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);

  // Fetch memories on mount
  useEffect(() => {
    async function loadMemories() {
      const { data } = await fetchMemoriesForJourney(journey.id);
      if (data) setMemories(data);
      setLoading(false);
    }
    loadMemories();
  }, [journey.id]);

  // Check if this journey was recently unlocked (within last hour) for celebration
  useEffect(() => {
    const unlockTime = new Date(journey.unlock_date).getTime();
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    if (unlockTime > hourAgo && unlockTime <= now) {
      setShowCelebration(true);
      const colors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#eab308'];
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
      }));
      setConfetti(particles);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [journey.unlock_date]);

  // Sorted memories (oldest first for story timeline)
  const sortedMemories = [...memories].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateA - dateB;
  });

  // Group memories by day for timeline view
  const memoriesByDay = sortedMemories.reduce((acc, memory) => {
    const date = new Date(memory.created_at);
    const dayKey = date.toDateString();
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(memory);
    return acc;
  }, {} as Record<string, Memory[]>);

  // Get ordered day keys and calculate day numbers
  const dayKeys = Object.keys(memoriesByDay);
  const firstDayDate = dayKeys.length > 0 ? new Date(dayKeys[0]) : null;

  // Toggle day collapse
  const toggleDayCollapse = (dayKey: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  // Stats
  const photoCount = memories.filter((m) => m.type === 'photo').length;
  const noteCount = memories.filter((m) => m.type === 'text').length;
  const audioCount = memories.filter((m) => m.type === 'audio').length;

  // Fetch AI recap
  const fetchRecap = async () => {
    if (recap) {
      setShowRecap(true);
      return;
    }

    setRecapLoading(true);
    try {
      const { data, error } = await api.post<{ recap: string; highlights: string[]; error?: string }>(
        '/api/ai/recap',
        { journeyId: journey.id }
      );

      if (error || (data?.error && !data?.recap)) {
        showToast(error || data?.error || 'Failed to generate recap', 'error');
      } else if (data?.recap) {
        setRecap(data.recap);
        setHighlights(data.highlights || []);
        setShowRecap(true);
      }
    } catch (err) {
      console.error('Recap fetch error:', err);
      showToast(ErrorMessages.GENERIC, 'error');
    } finally {
      setRecapLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteJourney = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const { error } = await deleteJourney(journey.id);
      if (error) {
        console.error('Delete journey error:', error);
        showToast(ErrorMessages.DELETE_FAILED('journey'), 'error');
        setIsDeleting(false);
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error('Delete journey exception:', err);
      showToast(ErrorMessages.GENERIC, 'error');
      setIsDeleting(false);
    }
  };

  const handleDeleteMemory = async () => {
    if (!memoryToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      const { error } = await deleteMemory(memoryToDelete.id);
      if (error) {
        console.error('Delete memory error:', error);
        showToast(ErrorMessages.DELETE_FAILED('memory'), 'error');
        setIsDeleting(false);
        return;
      }

      setMemories(memories.filter((m) => m.id !== memoryToDelete.id));
      setMemoryToDelete(null);
      setSelectedMemory(null);
      onMemoryDeleted?.();
    } catch (err) {
      console.error('Delete memory exception:', err);
      showToast(ErrorMessages.GENERIC, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- MEMORY VIEWER ---
  if (selectedMemory) {
    return (
      <MemoryViewer
        memory={selectedMemory}
        memories={sortedMemories}
        journeyName={journey.name}
        onClose={() => setSelectedMemory(null)}
        onDelete={(m) => setMemoryToDelete(m)}
        onNavigate={(m) => setSelectedMemory(m)}
      />
    );
  }

  // --- MAIN GALLERY VIEW ---
  return (
    <div className="fixed inset-0 z-40 safe-top safe-bottom overflow-y-auto">
      {/* Fixed full-screen immersive background */}
      <div className="fixed inset-0 -z-10">
        {journey.cover_image_url ? (
          <>
            <Image
              src={journey.cover_image_url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
            {/* Ambient orbs */}
            <div className="absolute top-20 right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-40 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          </div>
        )}
      </div>

      {/* Delete Memory Confirmation */}
      <ConfirmDialog
        isOpen={!!memoryToDelete}
        onClose={() => setMemoryToDelete(null)}
        onConfirm={handleDeleteMemory}
        title="Delete this memory?"
        description={`This ${memoryToDelete?.type === 'photo' ? 'photo' : memoryToDelete?.type === 'audio' ? 'audio' : 'note'} will be permanently deleted.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        loading={isDeleting}
      />

      {/* Delete Journey Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteJourneyConfirm}
        onClose={() => setShowDeleteJourneyConfirm(false)}
        onConfirm={handleDeleteJourney}
        title={`Delete "${journey.name}"?`}
        description={`This will permanently delete this journey and all ${memories.length} memories. This cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        loading={isDeleting}
      />

      {/* Edit Journey Modal */}
      {showEditModal && (
        <EditJourneyModal
          journey={journey}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updatedJourney) => {
            const merged = { ...updatedJourney, memory_count: journey.memory_count };
            setJourney(merged);
            onJourneyUpdated?.(merged);
          }}
        />
      )}

      {/* Celebration Confetti */}
      {showCelebration && (
        <>
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="confetti"
              style={{
                left: `${particle.left}%`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
              }}
            />
          ))}
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl px-8 py-6 animate-enter text-center border border-white/20">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold mb-1 text-white">Journey Unlocked!</h2>
              <p className="text-white/60">Time to relive the memories</p>
            </div>
          </div>
        </>
      )}

      {/* Sticky header - stays at top while scrolling */}
      <header className="sticky top-0 z-30 safe-top">
        {/* Extended gradient that covers overscroll bounce */}
        <div className="absolute inset-x-0 bottom-0 h-[200%] -top-[100%] bg-gradient-to-b from-black/60 via-black/60 to-transparent pointer-events-none" />
        <div className="relative flex justify-between items-center p-6">
          <IconButton 
            icon={<X className="w-5 h-5" />} 
            label="Close" 
            onClick={onClose}
            variant="ghost"
            dark 
          />
          
          <IconButton
            icon={<MoreVertical className="w-5 h-5" />}
            label="More options"
            onClick={() => setShowActionSheet(true)}
            variant="ghost"
            dark
          />
        </div>
      </header>

      {/* Hero section - scrolls naturally with content */}
      <div className="relative z-10 px-6 pt-4 pb-10 text-center min-h-[40vh] flex flex-col items-center justify-center">
        <h1 className="text-5xl font-light text-white mb-3 tracking-tight">
          {journey.emoji && <span className="mr-3 text-4xl">{journey.emoji}</span>}
          {journey.name}
        </h1>
        
        {/* Date range */}
        <p className="text-white/50 text-lg mb-6">
          {formatDate(journey.created_at, { month: 'short', day: 'numeric' })} – {formatDate(journey.unlock_date, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        
        {/* Stats pills */}
        {memories.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {photoCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <Camera className="w-4 h-4 text-white/70" />
                <span className="text-white font-medium">{photoCount}</span>
              </div>
            )}
            {audioCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <Play className="w-4 h-4 text-white/70" />
                <span className="text-white font-medium">{audioCount}</span>
              </div>
            )}
            {noteCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <Quote className="w-4 h-4 text-white/70" />
                <span className="text-white font-medium">{noteCount}</span>
              </div>
            )}
          </div>
        )}
        
        {/* AI Recap button - more prominent */}
        {memories.length > 0 && (
          <button
            onClick={fetchRecap}
            disabled={recapLoading}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold shadow-2xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${recapLoading ? 'animate-pulse' : ''}`} />
            {recapLoading ? 'Generating...' : recap ? 'View Recap' : 'Generate Recap'}
          </button>
        )}
      </div>

      {/* AI Recap Sheet */}
      {recap && (
        <AIRecapSheet
          isOpen={showRecap}
          onClose={() => setShowRecap(false)}
          journeyName={journey.name}
          recap={recap}
          highlights={highlights}
          photoCount={photoCount}
          audioCount={audioCount}
          noteCount={noteCount}
        />
      )}

      {/* Action Sheet */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        options={[
          ...((journey.memory_count ?? 0) > 0 ? [{
            label: recap ? 'View Recap' : 'Generate Recap',
            icon: <Sparkles className="w-5 h-5" />,
            onClick: () => { fetchRecap(); },
          }] : []),
          {
            label: 'Edit Journey',
            icon: <Pencil className="w-5 h-5" />,
            onClick: () => setShowEditModal(true),
          },
          {
            label: 'Delete Journey',
            icon: <Trash2 className="w-5 h-5" />,
            variant: 'danger' as const,
            onClick: () => setShowDeleteJourneyConfirm(true),
          },
        ]}
      />

      {/* Story Timeline - flows naturally */}
      <div className="relative z-10 px-6 pb-8">
        {loading ? (
          <div className="space-y-6">
            <div className="h-8 w-32 rounded-lg bg-white/10 animate-pulse" />
            <div className="aspect-[4/3] rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-24 rounded-2xl bg-white/10 animate-pulse" />
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Camera className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-xl text-white/60 mb-2">No memories yet</p>
            <p className="text-white/40 text-sm">Start capturing your story</p>
          </div>
        ) : (
          <div className="space-y-8">
            {dayKeys.map((dayKey, dayIndex) => {
              const dayMemories = memoriesByDay[dayKey];
              const dayDate = new Date(dayKey);
              const dayNumber = firstDayDate 
                ? Math.abs(Math.floor((dayDate.getTime() - firstDayDate.getTime()) / (1000 * 60 * 60 * 24))) + 1
                : dayIndex + 1;
              const formattedDate = dayDate.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <div 
                  key={dayKey} 
                  className="animate-enter"
                  style={{ animationDelay: `${dayIndex * 100}ms`, opacity: 0 }}
                >
                  {/* Day Header */}
                  <button
                    onClick={() => toggleDayCollapse(dayKey)}
                    className="w-full flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-black/30 backdrop-blur-sm"
                  >
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                      <span className="text-sm font-bold text-white">Day {dayNumber}</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium drop-shadow-md">{formattedDate}</p>
                      <p className="text-white/70 text-xs">{dayMemories.length} {dayMemories.length === 1 ? 'memory' : 'memories'}</p>
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
                        collapsedDays.has(dayKey) ? '-rotate-90' : ''
                      }`} 
                    />
                  </button>
                  
                  {/* Day Memories - grid layout */}
                  {!collapsedDays.has(dayKey) && (
                    <div className="grid grid-cols-2 gap-3">
                        {dayMemories.map((memory, memoryIndex) => {
                          const memoryTime = new Date(memory.created_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          });
                          
                          return (
                            <div
                              key={memory.id}
                              className="relative group animate-enter"
                              style={{ animationDelay: `${(dayIndex * 100) + (memoryIndex * 50)}ms`, opacity: 0 }}
                            >
                              {/* Photo Memory */}
                              {memory.type === 'photo' && memory.url && (
                                <button
                                  onClick={() => setSelectedMemory(memory)}
                                  className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform"
                                >
                                  <img
                                    src={memory.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                  <p className="absolute bottom-2 left-2 text-xs text-white/80">{memoryTime}</p>
                                </button>
                              )}
                              
                              {/* Note Memory */}
                              {memory.type === 'text' && (
                                <button
                                  onClick={() => setSelectedMemory(memory)}
                                  className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-500/40 to-orange-500/40 border border-amber-500/30 p-3 flex flex-col items-center justify-center active:scale-[0.98] transition-all backdrop-blur-sm"
                                >
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2 shadow-lg shadow-orange-500/30">
                                    <Quote className="w-5 h-5 text-white" />
                                  </div>
                                  <p className="text-white/80 text-sm text-center line-clamp-2 px-1">
                                    {memory.note && memory.note.length > 30 ? `${memory.note.slice(0, 30)}...` : memory.note}
                                  </p>
                                  <p className="text-xs text-white/40 mt-1">{memoryTime}</p>
                                </button>
                              )}
                              
                              {/* Audio Memory */}
                              {memory.type === 'audio' && (
                                <button
                                  onClick={() => setSelectedMemory(memory)}
                                  className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-500/40 to-orange-500/40 border border-amber-500/30 p-3 flex flex-col items-center justify-center active:scale-[0.98] transition-all backdrop-blur-sm"
                                >
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2 shadow-lg shadow-orange-500/30">
                                    <Play className="w-5 h-5 text-white ml-0.5" />
                                  </div>
                                  <p className="text-white/80 text-sm font-medium">
                                    {memory.duration 
                                      ? `${Math.floor(memory.duration / 60)}:${(memory.duration % 60).toString().padStart(2, '0')}`
                                      : 'Audio'
                                    }
                                  </p>
                                  <p className="text-xs text-white/40 mt-1">{memoryTime}</p>
                                </button>
                              )}
                              
                              {/* Delete button - hidden on mobile, visible on hover for desktop */}
                              <IconButton 
                                icon={<Trash2 className="w-3 h-3" />}
                                label="Delete memory"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMemoryToDelete(memory);
                                }}
                                variant="danger"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity hidden md:flex"
                              />
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
