'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api/client';
import { getJourneyGradient } from '@/lib/utils/gradients';
import {
  X,
  Trash2,
  Camera,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Copy,
  Check,
  Share,
  Loader2,
} from 'lucide-react';
import { useToast } from './Toast';
import type { Journey } from '@/types';

interface GalleryViewProps {
  journey: Journey;
  onClose: () => void;
  onMemoryDeleted?: () => void;
}

interface Memory {
  id: string;
  type: 'photo' | 'text';
  url?: string;
  note?: string;
  created_at: string;
}

export default function GalleryView({ journey, onClose, onMemoryDeleted }: GalleryViewProps) {
  const { showToast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [sortNewestFirst, setSortNewestFirst] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; color: string; delay: number }>>([]);

  // AI Recap state
  const [showRecap, setShowRecap] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);

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

  // Sorted memories
  const sortedMemories = [...memories].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortNewestFirst ? dateB - dateA : dateA - dateB;
  });

  // Stats
  const photoCount = memories.filter((m) => m.type === 'photo').length;
  const noteCount = memories.filter((m) => m.type === 'text').length;

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteJourney = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await supabase.from('memories').delete().eq('journey_id', journey.id);
      const { error } = await supabase.from('journeys').delete().eq('id', journey.id);

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

  const handleDeleteMemory = async (memoryId: string) => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.from('memories').delete().eq('id', memoryId);

      if (error) {
        console.error('Delete memory error:', error);
        showToast('Failed to delete memory', 'error');
        setIsDeleting(false);
        return;
      }

      setMemories(memories.filter((m) => m.id !== memoryId));
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

  useEffect(() => {
    async function fetchMemories() {
      const { data } = await supabase
        .from('memories')
        .select('*')
        .eq('journey_id', journey.id)
        .order('created_at', { ascending: true });

      if (data) setMemories(data);
      setLoading(false);
    }
    fetchMemories();
  }, [journey.id]);

  // Touch swipe handling
  const [copied, setCopied] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (goToPrev: () => void, goToNext: () => void) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrev();
  };

  const handleCopyNote = async (note: string) => {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Keyboard navigation for memory viewer
  useEffect(() => {
    if (!selectedMemory) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = sortedMemories.findIndex((m) => m.id === selectedMemory.id);

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSelectedMemory(sortedMemories[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && currentIndex < sortedMemories.length - 1) {
        setSelectedMemory(sortedMemories[currentIndex + 1]);
      } else if (e.key === 'Escape') {
        setSelectedMemory(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMemory, sortedMemories]);

  // --- SELECTED MEMORY VIEWER ---
  if (selectedMemory) {
    const memoryDate = new Date(selectedMemory.created_at);
    const formattedDate = memoryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const currentIndex = sortedMemories.findIndex((m) => m.id === selectedMemory.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < sortedMemories.length - 1;

    const goToPrev = () => {
      if (hasPrev) setSelectedMemory(sortedMemories[currentIndex - 1]);
    };
    const goToNext = () => {
      if (hasNext) setSelectedMemory(sortedMemories[currentIndex + 1]);
    };

    const handleDownload = async () => {
      if (selectedMemory.type === 'photo' && selectedMemory.url) {
        try {
          const response = await fetch(selectedMemory.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sunroof-${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Download failed:', err);
        }
      }
    };

    const handleShare = async () => {
      try {
        if (selectedMemory.type === 'photo' && selectedMemory.url) {
          if (navigator.share && navigator.canShare) {
            const response = await fetch(selectedMemory.url);
            const blob = await response.blob();
            const file = new File([blob], 'sunroof-memory.jpg', { type: 'image/jpeg' });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Sunroof Memory',
                text: `A memory from ${journey.name}`,
              });
              return;
            }
          }
          if (navigator.share) {
            await navigator.share({
              title: 'Sunroof Memory',
              text: `A memory from ${journey.name}`,
              url: selectedMemory.url,
            });
          }
        } else if (selectedMemory.type === 'text' && selectedMemory.note) {
          if (navigator.share) {
            await navigator.share({
              title: 'Sunroof Memory',
              text: selectedMemory.note,
            });
          }
        }
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => handleTouchEnd(goToPrev, goToNext)}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 safe-top">
          <button
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
            onClick={() => setSelectedMemory(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={handleShare}
              >
                <Share className="w-4 h-4 text-zinc-400" />
              </button>
            )}
            {selectedMemory.type === 'photo' && (
              <button
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 text-zinc-400" />
              </button>
            )}
            {selectedMemory.type === 'text' && (
              <button
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={() => handleCopyNote(selectedMemory.note || '')}
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </button>
            )}
            <button
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-red-500/20 transition-colors"
              onClick={() => setMemoryToDelete(selectedMemory)}
            >
              <Trash2 className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Navigation arrows (desktop only) */}
        {hasPrev && (
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center hover:bg-white/20 transition-colors hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center hover:bg-white/20 transition-colors hidden md:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {selectedMemory.type === 'photo' ? (
            <img
              src={selectedMemory.url}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0ibTIxIDE1LTUtNS01IDV6Ii8+PC9zdmc+';
              }}
            />
          ) : (
            <div className="max-w-md p-8 bg-zinc-900 rounded-2xl">
              <p className="text-xl text-white leading-relaxed">{selectedMemory.note}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent safe-bottom">
          <p className="text-center text-sm text-zinc-500">{formattedDate}</p>
          <p className="text-center text-xs text-zinc-600 mt-1">
            {currentIndex + 1} of {sortedMemories.length}
          </p>
        </div>
      </div>
    );
  }

  // --- DELETE SINGLE MEMORY CONFIRMATION ---
  if (memoryToDelete) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-6 animate-enter">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Delete this memory?</h3>
          <p className="text-zinc-500 text-sm text-center mb-6">
            This {memoryToDelete.type === 'photo' ? 'photo' : 'note'} will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setMemoryToDelete(null)}
              className="flex-1 h-12 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteMemory(memoryToDelete.id)}
              className="flex-1 h-12 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DELETE JOURNEY CONFIRMATION ---
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-6 animate-enter">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Delete &ldquo;{journey.name}&rdquo;?</h3>
          <p className="text-zinc-500 text-sm text-center mb-6">
            This will permanently delete this journey and all {memories.length} memories. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 h-12 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteJourney}
              className="flex-1 h-12 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN GALLERY VIEW ---
  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col safe-top safe-bottom">
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
      <header className="relative z-10 flex items-center gap-4 p-6 border-b border-zinc-900/50">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-medium">{journey.name}</h1>
          <p className="text-xs text-zinc-500">
            {photoCount > 0 && (
              <span>
                {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
              </span>
            )}
            {photoCount > 0 && noteCount > 0 && <span> • </span>}
            {noteCount > 0 && (
              <span>
                {noteCount} {noteCount === 1 ? 'note' : 'notes'}
              </span>
            )}
            {photoCount === 0 && noteCount === 0 && <span>No memories</span>}
          </p>
        </div>
        {/* AI Recap button */}
        {memories.length > 0 && (
          <button
            onClick={fetchRecap}
            disabled={recapLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              recap
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-white/5 text-zinc-500 hover:bg-purple-500/10 hover:text-purple-400'
            }`}
            title="AI Journey Recap"
          >
            {recapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={() => setSortNewestFirst(!sortNewestFirst)}
          className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors ${
            sortNewestFirst ? 'text-orange-400' : 'text-zinc-500'
          }`}
          title={sortNewestFirst ? 'Showing newest first' : 'Showing oldest first'}
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-zinc-500" />
        </button>
      </header>

      {/* AI Recap Modal */}
      {showRecap && recap && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col safe-top safe-bottom animate-enter">
          <div className="flex items-center justify-between p-6 border-b border-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Journey Recap</h2>
                <p className="text-xs text-zinc-500">AI-generated summary</p>
              </div>
            </div>
            <button
              onClick={() => setShowRecap(false)}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="max-w-lg mx-auto space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-light mb-2">{journey.name}</h1>
                <p className="text-zinc-500 text-sm">
                  {photoCount} {photoCount === 1 ? 'photo' : 'photos'} • {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <p className="text-lg leading-relaxed text-zinc-200 whitespace-pre-wrap">{recap}</p>
              </div>

              {highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Highlights
                  </h3>
                  <div className="space-y-2">
                    {highlights.map((highlight, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20"
                      >
                        <span className="text-amber-400 text-lg">✦</span>
                        <p className="text-zinc-300">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRecap(false)}
                  className="flex-1 h-12 bg-white text-black rounded-full font-semibold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all"
                >
                  View Memories
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort indicator */}
      {memories.length > 0 && (
        <div className="px-4 py-2 flex justify-end">
          <span className="text-xs text-zinc-600">{sortNewestFirst ? 'Newest first' : 'Oldest first'}</span>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-4 pt-0">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl skeleton" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
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
          <div className="grid grid-cols-2 gap-2">
            {sortedMemories.map((memory, i) => {
              const tileDate = new Date(memory.created_at);
              const tileTime = tileDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              const tileDay = tileDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div
                  key={memory.id}
                  className="animate-enter relative group"
                  style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
                >
                  <button
                    onClick={() => setSelectedMemory(memory)}
                    className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 hover:opacity-90 transition-opacity"
                  >
                    {memory.type === 'photo' ? (
                      <img
                        src={memory.url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.parentElement!.innerHTML =
                            '<div class="w-full h-full bg-zinc-800 flex items-center justify-center"><span class="text-zinc-600 text-xs">Failed to load</span></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full p-4 flex items-center justify-center">
                        <p className="text-sm text-zinc-300 text-center line-clamp-4">{memory.note}</p>
                      </div>
                    )}
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm pointer-events-none">
                    <p className="text-[10px] text-white/80">
                      {tileDay} • {tileTime}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemoryToDelete(memory);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-red-500/80 transition-all active:scale-95"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

