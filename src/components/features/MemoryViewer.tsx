'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight, Download, Copy, Check, Share, Mic, MapPin, Quote, Image, Calendar, Cloud } from 'lucide-react';
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
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 safe-top">
        <IconButton icon={<X className="w-5 h-5" />} label="Close" onClick={onClose} dark />
        <div className="flex gap-2">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <IconButton icon={<Share className="w-4 h-4" />} label="Share" onClick={handleShare} dark />
          )}
          {memory.type === 'photo' && (
            <IconButton icon={<Download className="w-4 h-4" />} label="Download" onClick={handleDownload} dark />
          )}
          {memory.type === 'text' && (
            <IconButton 
              icon={copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} 
              label="Copy note" 
              onClick={() => handleCopyNote(memory.note || '')} 
              dark 
            />
          )}
          <IconButton icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={() => onDelete(memory)} variant="danger" dark />
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
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 pb-8 overflow-auto">
        {/* Photo */}
        {memory.type === 'photo' && memory.url && (
          <div className="flex flex-col items-center max-w-2xl w-full">
            <img
              src={memory.url}
              alt=""
              className="max-w-full max-h-[60vh] object-contain rounded-2xl border border-pink-500/20"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0ibTIxIDE1LTUtNS01IDV6Ii8+PC9zdmc+';
              }}
            />
            {/* Photo metadata */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-sm text-pink-300">{formattedDate}</span>
              </div>
              {memory.location_name && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-sm text-pink-300">{memory.location_name}</span>
                </div>
              )}
              {memory.weather && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                  <span className="text-sm">{memory.weather.icon}</span>
                  <span className="text-sm text-pink-300">{memory.weather.temp}°F {memory.weather.condition}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Audio */}
        {memory.type === 'audio' && memory.url && (
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Voice Note</h3>
              {memory.duration && (
                <p className="text-sm text-orange-400/60">
                  {Math.floor(memory.duration / 60)}:{(memory.duration % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
            <AudioPlayer 
              src={memory.url} 
              duration={memory.duration}
              showWaveform={true}
            />
            {/* Audio metadata */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-sm text-orange-300">{formattedDate}</span>
              </div>
              {memory.location_name && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm text-orange-300">{memory.location_name}</span>
                </div>
              )}
              {memory.weather && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <span className="text-sm">{memory.weather.icon}</span>
                  <span className="text-sm text-orange-300">{memory.weather.temp}°F</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Note */}
        {memory.type === 'text' && (
          <div className="w-full max-w-md">
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Quote className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-lg text-zinc-100 leading-relaxed">{memory.note}</p>
            </div>
            {/* Note metadata */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-sm text-blue-300">{formattedDate}</span>
              </div>
              {memory.location_name && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-sm text-blue-300">{memory.location_name}</span>
                </div>
              )}
              {memory.weather && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-sm">{memory.weather.icon}</span>
                  <span className="text-sm text-blue-300">{memory.weather.temp}°F</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Position indicator */}
      <div className="absolute bottom-6 left-0 right-0 text-center safe-bottom">
        <p className="text-xs text-zinc-600">
          {currentIndex + 1} of {memories.length}
        </p>
      </div>
    </div>
  );
}

