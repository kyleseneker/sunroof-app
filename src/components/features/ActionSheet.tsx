'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { hapticClick } from '@/lib';

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

const SWIPE_THRESHOLD = 100; // pixels to swipe before closing

/**
 * Mobile-friendly action sheet / bottom sheet component.
 * Slides up from bottom on mobile, supports swipe-to-dismiss.
 */
export default function ActionSheet({ 
  isOpen, 
  onClose, 
  title, 
  options 
}: ActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setDragOffset(0);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Swipe-to-dismiss handlers (only on handle area)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    // Only allow dragging down (positive diff)
    if (diff > 0) {
      setDragOffset(diff);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > SWIPE_THRESHOLD) {
      hapticClick();
      handleClose();
    } else {
      // Snap back
      setDragOffset(0);
    }
  }, [isDragging, dragOffset, handleClose]);

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

  // Reset drag offset when closed
  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOptionClick = (option: ActionSheetOption) => {
    if (option.disabled) return;
    hapticClick();
    option.onClick();
    handleClose();
  };

  // Calculate backdrop opacity based on drag
  const backdropOpacity = Math.max(0.7 - (dragOffset / 400), 0.3);

  return (
    <div 
      className={`fixed inset-0 z-50 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        style={{ opacity: backdropOpacity }}
      />
      
      {/* Sheet - glassmorphism style */}
      <div 
        ref={sheetRef}
        className={`
          absolute bottom-0 left-0 right-0
          bg-gradient-to-br from-amber-950/98 via-orange-950/98 to-slate-950/98 backdrop-blur-xl
          border-t border-white/10
          rounded-t-3xl
          safe-bottom
          ${isClosing ? 'animate-slide-down' : isDragging ? '' : 'animate-slide-up'}
          ${isDragging ? '' : 'transition-transform duration-200'}
        `}
        style={{ transform: `translateY(${dragOffset}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle - swipe zone for dismiss */}
        <div 
          ref={handleRef}
          className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 py-3 border-b border-white/10">
            <h3 className="text-sm font-medium text-white/60 text-center">{title}</h3>
          </div>
        )}

        {/* Options */}
        <div className="p-3">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={`
                w-full flex items-center gap-4 px-4 py-4
                rounded-2xl text-left
                transition-all
                ${option.disabled 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'active:bg-white/10 hover:bg-white/5'
                }
                ${option.variant === 'danger' 
                  ? 'text-red-400' 
                  : 'text-white'
                }
              `}
            >
              {option.icon && (
                <span className={`
                  w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-sm
                  ${option.variant === 'danger' 
                    ? 'bg-red-500/20 border border-red-500/20' 
                    : 'bg-white/10 border border-white/10'
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
        <div className="p-3 pt-0">
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 font-medium hover:bg-white/15 active:bg-white/20 transition-all"
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

