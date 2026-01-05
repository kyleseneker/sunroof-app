'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight, Download, Copy, Check, Share, Mic, Quote } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { AudioPlayer } from '@/components/features';
import type { Memory } from '@/types';

interface MemoryViewerProps {
  memory: Memory;
  memories: Memory[];
  journeyName: string;
  onClose: () => void;
  onDelete: (memory: Memory) => void;
  onNavigate: (memory: Memory) => void;
}

export default function MemoryViewer({
  memory,
  memories,
  journeyName,
  onClose,
  onDelete,
  onNavigate,
}: MemoryViewerProps) {
  const [copied, setCopied] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const currentIndex = memories.findIndex((m) => m.id === memory.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < memories.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) onNavigate(memories[currentIndex - 1]);
  }, [hasPrev, memories, currentIndex, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext) onNavigate(memories[currentIndex + 1]);
  }, [hasNext, memories, currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, onClose]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goToNext();
    if (distance < -minSwipeDistance) goToPrev();
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

  const handleDownload = async () => {
    if (memory.type === 'photo' && memory.url) {
      try {
        const response = await fetch(memory.url);
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
      if (memory.type === 'photo' && memory.url) {
        if (navigator.share && navigator.canShare) {
          const response = await fetch(memory.url);
          const blob = await response.blob();
          const file = new File([blob], 'sunroof-memory.jpg', { type: 'image/jpeg' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Sunroof Memory',
              text: `A memory from ${journeyName}`,
            });
            return;
          }
        }
        if (navigator.share) {
          await navigator.share({
            title: 'Sunroof Memory',
            text: `A memory from ${journeyName}`,
            url: memory.url,
          });
        }
      } else if (memory.type === 'text' && memory.note) {
        if (navigator.share) {
          await navigator.share({
            title: 'Sunroof Memory',
            text: memory.note,
          });
        }
      }
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  };

  const memoryDate = new Date(memory.created_at);
  const formattedDate = memoryDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = memoryDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Unified warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
        <div className="absolute top-20 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top">
        <div className="flex justify-between items-center p-6">
          <IconButton 
            icon={<X className="w-5 h-5" />} 
            label="Close" 
            onClick={onClose} 
            variant="ghost"
            dark
          />
          <div className="flex gap-2">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <IconButton 
                icon={<Share className="w-5 h-5" />} 
                label="Share" 
                onClick={handleShare} 
                variant="ghost"
                dark
              />
            )}
            {memory.type === 'photo' && (
              <IconButton 
                icon={<Download className="w-5 h-5" />} 
                label="Download" 
                onClick={handleDownload} 
                variant="ghost"
                dark
              />
            )}
            {memory.type === 'text' && (
              <IconButton 
                icon={copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />} 
                label="Copy note" 
                onClick={() => handleCopyNote(memory.note || '')} 
                variant="ghost"
                dark
              />
            )}
            <IconButton 
              icon={<Trash2 className="w-5 h-5" />} 
              label="Delete" 
              onClick={() => onDelete(memory)} 
              variant="ghost"
              dark
            />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 safe-top safe-bottom overflow-hidden">
        
        {/* Photo */}
        {memory.type === 'photo' && memory.url && (
          <div className="flex flex-col items-center">
            <img
              src={memory.url}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0ibTIxIDE1LTUtNS01IDV6Ii8+PC9zdmc+';
              }}
            />
            {/* Subtle metadata below photo */}
            <p className="mt-4 text-white/40 text-sm">
              {formattedDate} · {formattedTime}
              {memory.location_name && ` · ${memory.location_name}`}
            </p>
          </div>
        )}

        {/* Audio */}
        {memory.type === 'audio' && memory.url && (
          <div className="w-full max-w-md text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                <Mic className="w-10 h-10 text-amber-400" />
              </div>
            </div>
            
            {/* Player */}
            <AudioPlayer 
              src={memory.url} 
              duration={memory.duration}
              showWaveform={true}
            />
            
            {/* Subtle metadata */}
            <p className="mt-6 text-white/40 text-sm">
              {formattedDate} · {formattedTime}
              {memory.location_name && ` · ${memory.location_name}`}
            </p>
          </div>
        )}

        {/* Note */}
        {memory.type === 'text' && memory.note && (
          <div className="w-full max-w-lg text-center">
            {/* Note text */}
            <p className="text-2xl font-light text-white leading-relaxed">
              &ldquo;{memory.note}&rdquo;
            </p>
            
            {/* Subtle metadata */}
            <p className="mt-6 text-white/40 text-sm">
              {formattedDate} · {formattedTime}
              {memory.location_name && ` · ${memory.location_name}`}
            </p>
          </div>
        )}
        
        {/* Counter - subtle, at bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-white/30 text-sm">
          <span>{currentIndex + 1}</span>
          <span>/</span>
          <span>{memories.length}</span>
        </div>
      </div>

      {/* Navigation arrows (desktop) */}
      {hasPrev && (
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center hover:bg-white/20 transition-all hidden md:flex text-white border border-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center hover:bg-white/20 transition-all hidden md:flex text-white border border-white/10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
