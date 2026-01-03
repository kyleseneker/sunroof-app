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
      <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3">
        <Smile className="w-3 h-3" />
        {label} <span className="text-[var(--fg-subtle)] normal-case tracking-normal">(optional)</span>
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl 
          bg-[var(--bg-surface)] border transition-all
          ${isOpen ? 'border-[var(--fg-base)]' : 'border-[var(--border-base)]'}
          hover:border-[var(--fg-subtle)]
        `}
      >
        {value ? (
          <>
            <span className="text-2xl">{value}</span>
            <span className="text-sm text-[var(--fg-muted)] flex-1 text-left">Change icon</span>
            <button
              type="button"
              onClick={handleClear}
              className="w-6 h-6 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors"
            >
              <X className="w-3 h-3 text-[var(--fg-muted)]" />
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
              <Smile className="w-4 h-4 text-[var(--fg-subtle)]" />
            </div>
            <span className="text-sm text-[var(--fg-subtle)]">Add an icon to your journey</span>
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Emoji grid */}
          <div className="absolute z-50 top-full left-0 right-0 mt-2 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xl animate-fade-in">
            <div className="grid grid-cols-8 gap-1">
              {JOURNEY_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className={`
                    w-10 h-10 flex items-center justify-center text-xl rounded-lg
                    hover:bg-[var(--bg-hover)] active:scale-90 transition-all
                    ${value === emoji ? 'bg-[var(--bg-muted)] ring-2 ring-[var(--fg-base)]' : ''}
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

