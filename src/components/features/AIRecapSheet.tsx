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
        <IconButton icon={<X className="w-5 h-5" />} label="Close" onClick={onClose} dark />
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light mb-2">{journeyName}</h1>
            <p className="text-zinc-500 text-sm">
              {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
              {audioCount > 0 && ` • ${audioCount} ${audioCount === 1 ? 'voice note' : 'voice notes'}`}
              {noteCount > 0 && ` • ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}`}
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
              onClick={onClose}
              className="flex-1 h-12 bg-white text-black rounded-full font-semibold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all"
            >
              View Memories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

