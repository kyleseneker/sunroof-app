'use client';

import { useState } from 'react';
import { Smile, X } from 'lucide-react';

interface EmojiPickerProps {
  value?: string | null;
  onChange: (emoji: string | null) => void;
  label?: string;
}

// Curated travel/journey-themed emojis
const JOURNEY_EMOJIS = [
  // Travel
  '✈️', '🚗', '🚂', '🚢', '🚀', '🛸', '🚁', '🛶',
  // Places
  '🏖️', '🏔️', '🏕️', '🏝️', '🌆', '🌃', '🌄', '🗼',
  // Activities  
  '🎢', '🎡', '⛷️', '🏄', '🚴', '🧗', '🎣', '🏊',
  // Nature
  '🌸', '🌺', '🌻', '🌴', '🌊', '❄️', '☀️', '🌙',
  // Food & Celebrations
  '🎂', '🎄', '🎃', '🎁', '🍕', '🍦', '🍷', '☕',
  // Symbols
  '❤️', '⭐', '🔥', '💎', '🎯', '🏆', '📸', '🎵',
  // Animals
  '🐕', '🐈', '🦋', '🐬', '🦜', '🐢', '🦀', '🐙',
  // Other
  '🎨', '📚', '🎮', '🧘', '💪', '🙏', '✨', '🌈',
];

export default function EmojiPicker({ value, onChange, label = 'Icon' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 font-medium mb-3">
        <Smile className="w-3 h-3" />
        {label} <span className="text-white/30 normal-case tracking-normal">(optional)</span>
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-2xl h-14
          bg-white/5 backdrop-blur-md border transition-all
          ${isOpen ? 'border-amber-400/50 bg-white/10' : 'border-white/20'}
          hover:border-white/40 hover:bg-white/10
        `}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
          {value ? (
            <span className="text-xl">{value}</span>
          ) : (
            <Smile className="w-5 h-5 text-white/40" />
          )}
        </div>
        <span className="text-sm text-white/50 flex-1 text-left">
          {value ? 'Tap to change' : 'Add an icon'}
        </span>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Emoji grid */}
          <div className="absolute z-50 top-full left-0 right-0 mt-2 p-4 rounded-3xl bg-gradient-to-br from-amber-950/98 via-orange-950/98 to-slate-950/98 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <span className="text-sm font-medium text-white/70">Choose an icon</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3 text-white/60" />
              </button>
            </div>
            
            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-1.5">
              {JOURNEY_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className={`
                    w-10 h-10 flex items-center justify-center text-xl rounded-xl
                    hover:bg-white/20 active:scale-90 transition-all
                    ${value === emoji 
                      ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-lg shadow-amber-500/20' 
                      : 'hover:bg-white/10'
                    }
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
