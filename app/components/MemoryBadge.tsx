'use client';

import { useEffect, useState } from 'react';
import { Camera, FileText, Lock, Sparkles } from 'lucide-react';

interface MemoryBadgeProps {
  count: number;
  isLocked?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  photoCount?: number;
  noteCount?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Animated badge showing memory count for a journey.
 * Features pulse animation when count updates.
 */
export default function MemoryBadge({
  count,
  isLocked = true,
  variant = 'default',
  photoCount,
  noteCount,
  className = '',
  animate = true,
}: MemoryBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  // Animate when count increases
  useEffect(() => {
    if (count > prevCount && animate) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount, animate]);

  if (count === 0) return null;

  // Compact variant - just a small number badge
  if (variant === 'compact') {
    return (
      <div
        className={`
          inline-flex items-center justify-center
          min-w-[20px] h-5 px-1.5
          rounded-full text-xs font-semibold
          ${isLocked 
            ? 'bg-amber-500/20 text-amber-400' 
            : 'bg-emerald-500/20 text-emerald-400'
          }
          ${isAnimating ? 'animate-bounce-subtle' : ''}
          ${className}
        `}
      >
        {count}
      </div>
    );
  }

  // Detailed variant - shows photo/note breakdown
  if (variant === 'detailed' && (photoCount !== undefined || noteCount !== undefined)) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {photoCount !== undefined && photoCount > 0 && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Camera className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{photoCount}</span>
          </div>
        )}
        {noteCount !== undefined && noteCount > 0 && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{noteCount}</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 
        px-2.5 py-1 rounded-full text-xs font-medium
        ${isLocked 
          ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50' 
          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }
        transition-all duration-300
        ${isAnimating ? 'scale-110 bg-amber-500/20 border-amber-500/30 text-amber-400' : ''}
        ${className}
      `}
    >
      {isLocked ? (
        <Lock className="w-3 h-3" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      <span>
        {count} {count === 1 ? 'memory' : 'memories'}
      </span>
    </div>
  );
}

// Add animation to globals.css
export const memoryBadgeStyles = `
@keyframes bounce-subtle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 0.3s ease-out;
}
`;

