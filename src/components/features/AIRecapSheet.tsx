'use client';

import { X, Sparkles } from 'lucide-react';
import { IconButton } from '@/components/ui';

interface AIRecapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  journeyName: string;
  recap: string;
  highlights: string[];
  photoCount: number;
  audioCount: number;
  noteCount: number;
}

export default function AIRecapSheet({
  isOpen,
  onClose,
  journeyName,
  recap,
  highlights,
  photoCount,
  audioCount,
  noteCount,
}: AIRecapSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
      
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <IconButton 
          icon={<X className="w-5 h-5" />} 
          label="Close" 
          onClick={onClose} 
          variant="ghost"
          dark 
        />
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-light text-white mb-2">{journeyName}</h1>
            <p className="text-white/50 text-sm">
              {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
              {audioCount > 0 && ` • ${audioCount} ${audioCount === 1 ? 'audio' : 'audio'}`}
              {noteCount > 0 && ` • ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}`}
            </p>
          </div>

          {/* Recap text */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">{recap}</p>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Highlights
              </h3>
              <div className="space-y-2">
                {highlights.map((highlight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20"
                  >
                    <span className="text-amber-400 text-lg">✦</span>
                    <p className="text-white/80">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
            >
              View Memories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

