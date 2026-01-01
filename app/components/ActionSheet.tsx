'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { hapticClick } from '@/lib/haptics';

interface ActionSheetOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

/**
 * Mobile-friendly action sheet / bottom sheet component.
 * Slides up from bottom on mobile, appears as a context menu on desktop.
 */
export default function ActionSheet({ 
  isOpen, 
  onClose, 
  title, 
  options 
}: ActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOptionClick = (option: ActionSheetOption) => {
    if (option.disabled) return;
    hapticClick();
    option.onClick();
    handleClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-50 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Sheet */}
      <div 
        ref={sheetRef}
        className={`
          absolute bottom-0 left-0 right-0
          bg-zinc-900 border-t border-zinc-800
          rounded-t-3xl
          safe-bottom
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 text-center">{title}</h3>
          </div>
        )}

        {/* Options */}
        <div className="p-2">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={`
                w-full flex items-center gap-4 px-4 py-4
                rounded-xl text-left
                transition-colors
                ${option.disabled 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'active:bg-zinc-800'
                }
                ${option.variant === 'danger' 
                  ? 'text-red-400' 
                  : 'text-white'
                }
              `}
            >
              {option.icon && (
                <span className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${option.variant === 'danger' 
                    ? 'bg-red-500/10' 
                    : 'bg-zinc-800'
                  }
                `}>
                  {option.icon}
                </span>
              )}
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <div className="p-2 pt-0">
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to handle long-press for triggering action sheets
export function useLongPress(
  onLongPress: () => void,
  onClick?: () => void,
  { delay = 500 }: { delay?: number } = {}
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    
    // Record start position
    if ('touches' in e) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      startPos.current = { x: e.clientX, y: e.clientY };
    }
    
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      hapticClick();
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!timeoutRef.current) return;
    
    // Check if moved too far (cancel long press)
    let currentPos = { x: 0, y: 0 };
    if ('touches' in e) {
      currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      currentPos = { x: e.clientX, y: e.clientY };
    }
    
    const distance = Math.sqrt(
      Math.pow(currentPos.x - startPos.current.x, 2) +
      Math.pow(currentPos.y - startPos.current.y, 2)
    );
    
    if (distance > 10) {
      clear();
    }
  }, [clear]);

  const end = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    clear();
    
    // Only trigger click if it wasn't a long press
    if (!isLongPress.current && onClick) {
      onClick();
    }
    
    // Prevent context menu on mobile
    if (isLongPress.current) {
      e.preventDefault();
    }
  }, [clear, onClick]);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: clear,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      onLongPress();
    },
  };
}

