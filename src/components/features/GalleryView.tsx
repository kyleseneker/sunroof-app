'use client';

import { useState, useEffect } from 'react';
import { api, getJourneyGradient } from '@/lib';
import { deleteJourney, deleteMemory, fetchMemoriesForJourney } from '@/services';
import { X, Trash2, Camera, Sparkles, Mic, MapPin, Play, ChevronDown, Quote, Pencil } from 'lucide-react';
import { useToast, ConfirmDialog, IconButton } from '@/components/ui';
import { AudioPlayer, MemoryViewer, AIRecapSheet, EditJourneyModal } from '@/components/features';
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
      showToast('Failed to generate recap', 'error');
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
        showToast('Failed to delete journey', 'error');
        setIsDeleting(false);
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error('Delete journey exception:', err);
      showToast('Something went wrong', 'error');
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
        showToast('Failed to delete memory', 'error');
        setIsDeleting(false);
        return;
      }

      setMemories(memories.filter((m) => m.id !== memoryToDelete.id));
      setMemoryToDelete(null);
      setSelectedMemory(null);
      onMemoryDeleted?.();
    } catch (err) {
      console.error('Delete memory exception:', err);
      showToast('Something went wrong', 'error');
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
    <div className="fixed inset-0 z-40 bg-black flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Delete Memory Confirmation */}
      <ConfirmDialog
        isOpen={!!memoryToDelete}
        onClose={() => setMemoryToDelete(null)}
        onConfirm={handleDeleteMemory}
        title="Delete this memory?"
        description={`This ${memoryToDelete?.type === 'photo' ? 'photo' : memoryToDelete?.type === 'audio' ? 'voice note' : 'note'} will be permanently deleted.`}
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
            // Preserve memory_count since updateJourney doesn't return it
            const merged = { ...updatedJourney, memory_count: journey.memory_count };
            setJourney(merged);
            onJourneyUpdated?.(merged);
          }}
        />
      )}

      {/* Gradient header accent */}
      <div
        className="absolute top-0 left-0 right-0 h-32 opacity-40"
        style={{ background: getJourneyGradient(journey.name).gradient }}
      />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black" />

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
            <div className="bg-black/80 backdrop-blur-xl rounded-3xl px-8 py-6 animate-enter text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold mb-1">Journey Unlocked!</h2>
              <p className="text-zinc-400">Time to relive the memories</p>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <IconButton 
          icon={<X className="w-5 h-5" />} 
          label="Close" 
          onClick={onClose}
          variant="bordered"
          dark 
        />
        <div className="flex-1 min-w-0 mx-4">
          <h1 className="text-xl font-medium truncate">
            {journey.emoji && <span className="mr-2">{journey.emoji}</span>}
            {journey.name}
          </h1>
          <p className="text-xs text-zinc-500">
            {(journey.memory_count ?? 0) === 0 ? 'No memories' : `${journey.memory_count} ${journey.memory_count === 1 ? 'memory' : 'memories'}`}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* AI Recap button - use journey.memory_count to avoid layout shift */}
          {(journey.memory_count ?? 0) > 0 && (
            <IconButton
              icon={<Sparkles className="w-4 h-4" />}
              label="AI Journey Recap"
              onClick={fetchRecap}
              loading={recapLoading}
              active={!!recap}
              variant="bordered"
              dark
              className={recap ? 'bg-purple-500/20 text-purple-400' : ''}
            />
          )}
          
          <IconButton
            icon={<Pencil className="w-4 h-4" />}
            label="Edit journey"
            onClick={() => setShowEditModal(true)}
            variant="bordered"
            dark
          />
          
          <IconButton
            icon={<Trash2 className="w-4 h-4" />}
            label="Delete journey"
            onClick={() => setShowDeleteJourneyConfirm(true)}
            variant="bordered"
            dark
          />
        </div>
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

      {/* Story Timeline */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 pt-0 space-y-6">
            <div className="h-8 w-32 rounded-lg skeleton" />
            <div className="aspect-[4/3] rounded-2xl skeleton" />
            <div className="h-24 rounded-2xl skeleton" />
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
            <div className="relative w-20 h-20 mb-6 empty-illustration">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-8 h-8 text-zinc-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500/50 animate-pulse" />
            </div>
            <p className="text-lg text-zinc-400 mb-2">No memories yet</p>
            <p className="text-sm text-zinc-600">Photos and notes will appear here</p>
          </div>
        ) : (
          <div className="pb-8 max-w-2xl mx-auto">
            {dayKeys.map((dayKey, dayIndex) => {
              const dayMemories = memoriesByDay[dayKey];
              const dayDate = new Date(dayKey);
              const dayNumber = firstDayDate 
                ? Math.abs(Math.floor((dayDate.getTime() - firstDayDate.getTime()) / (1000 * 60 * 60 * 24))) + 1
                : dayIndex + 1;
              const formattedDate = dayDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric' 
              });
              
              // Get weather range for the day
              const temps = dayMemories
                .filter(m => m.weather?.temp)
                .map(m => m.weather!.temp);
              const minTemp = temps.length > 0 ? Math.min(...temps) : null;
              const maxTemp = temps.length > 0 ? Math.max(...temps) : null;
              const weatherIcon = dayMemories.find(m => m.weather?.icon)?.weather?.icon;
              
              return (
                <div 
                  key={dayKey} 
                  className="animate-enter"
                  style={{ animationDelay: `${dayIndex * 100}ms`, opacity: 0 }}
                >
                  {/* Day Header - Clickable to collapse */}
                  <button
                    onClick={() => toggleDayCollapse(dayKey)}
                    className="sticky top-0 z-10 w-full px-6 py-4 bg-gradient-to-b from-black via-black/95 to-transparent backdrop-blur-sm text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {dayNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-white">Day {dayNumber}</h3>
                          <ChevronDown 
                            className={`w-4 h-4 text-zinc-500 transition-transform duration-200 flex-shrink-0 ${
                              collapsedDays.has(dayKey) ? '-rotate-90' : ''
                            }`} 
                          />
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                          {formattedDate}
                          {collapsedDays.has(dayKey) && (
                            <span className="text-zinc-600"> • {dayMemories.length} {dayMemories.length === 1 ? 'memory' : 'memories'}</span>
                          )}
                        </p>
                      </div>
                      {minTemp !== null && (
                        <div className="flex items-center gap-1 text-xs text-zinc-400 flex-shrink-0">
                          {weatherIcon && <span>{weatherIcon}</span>}
                          <span>
                            {minTemp === maxTemp ? `${minTemp}°` : `${minTemp}–${maxTemp}°`}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* Day Memories - Collapsible */}
                  {!collapsedDays.has(dayKey) && (
                  <div className="px-6 py-4 space-y-4">
                    {dayMemories.map((memory, memoryIndex) => {
                      const memoryTime = new Date(memory.created_at).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      });
                      const isFirstPhoto = memoryIndex === 0 && memory.type === 'photo';
                      
                      return (
                        <div
                          key={memory.id}
                          className="animate-enter relative group"
                          style={{ animationDelay: `${(dayIndex * 100) + (memoryIndex * 50)}ms`, opacity: 0 }}
                        >
                          {/* Photo Memory - Pink theme */}
                          {memory.type === 'photo' && memory.url && (
                            <button
                              onClick={() => setSelectedMemory(memory)}
                              className={`w-full rounded-2xl overflow-hidden bg-zinc-900 border border-pink-500/20 hover:border-pink-500/40 transition-colors ${
                                isFirstPhoto ? 'aspect-[4/3]' : 'aspect-square'
                              }`}
                            >
                              <img
                                src={memory.url}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-pink-500/20">
                                  <p className="text-[11px] text-pink-300/90">{memoryTime}</p>
                                </div>
                                {memory.location_name && (
                                  <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-pink-500/20 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-pink-400/60" />
                                    <p className="text-[11px] text-pink-300/90">{memory.location_name}</p>
                                  </div>
                                )}
                              </div>
                            </button>
                          )}
                          
                          {/* Note Memory - Blue theme */}
                          {memory.type === 'text' && (
                            <button
                              onClick={() => setSelectedMemory(memory)}
                              className="w-full text-left p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <Quote className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-zinc-200 leading-relaxed line-clamp-3">
                                    {memory.note}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-blue-400/60">
                                    <span>{memoryTime}</span>
                                    {memory.location_name && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-2.5 h-2.5" />
                                          {memory.location_name}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )}
                          
                          {/* Audio Memory - Orange theme */}
                          {memory.type === 'audio' && (
                            <button
                              onClick={() => setSelectedMemory(memory)}
                              className="w-full p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                  <Play className="w-4 h-4 text-orange-400 ml-0.5" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-sm text-zinc-200">Voice</p>
                                  <p className="text-xs text-orange-400/60">
                                    {memory.duration 
                                      ? `${Math.floor(memory.duration / 60)}:${(memory.duration % 60).toString().padStart(2, '0')}`
                                      : 'Tap to play'
                                    }
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs text-orange-400/60">{memoryTime}</p>
                                  {memory.location_name && (
                                    <p className="text-[10px] text-orange-400/40 flex items-center gap-1 justify-end mt-0.5">
                                      <MapPin className="w-2 h-2" />
                                      {memory.location_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          )}
                          
                          {/* Delete button */}
                          <IconButton 
                            icon={<Trash2 className="w-3 h-3" />}
                            label="Delete memory"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemoryToDelete(memory);
                            }}
                            variant="danger"
                            size="sm"
                            dark
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
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
