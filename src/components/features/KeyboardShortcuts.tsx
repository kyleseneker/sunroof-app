'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks';

interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

// Define all app shortcuts in one place
export const APP_SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['Esc'], description: 'Close modal / Go back', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['N'], description: 'New journey', category: 'Navigation' },
  { keys: ['/'], description: 'Focus search', category: 'Navigation' },
  
  // Actions
  { keys: ['⌘', 'Enter'], description: 'Submit form / Confirm', category: 'Actions' },
  
  // Gallery
  { keys: ['←', '→'], description: 'Previous / Next photo', category: 'Gallery' },
  { keys: ['S'], description: 'Toggle sort order', category: 'Gallery' },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Renders a single keyboard key with styling
 */
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-300 shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
      {children}
    </kbd>
  );
}

/**
 * Modal displaying all available keyboard shortcuts.
 * Triggered with "?" key.
 */
export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const grouped = APP_SHORTCUTS.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-enter"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-zinc-500">Press any key to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">
          {Object.entries(grouped).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-zinc-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          {j > 0 && <span className="text-zinc-600 text-xs">+</span>}
                          <Key>{key === '⌘' ? <Command className="w-3 h-3" /> : key}</Key>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-600 text-center">
            Press <Key>?</Key> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage keyboard shortcuts help modal state.
 * Includes binding for "?" key to open the modal.
 * Only active on desktop (devices with keyboards).
 */
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop (non-touch or large screen)
  useEffect(() => {
    const checkDesktop = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isLargeScreen = window.innerWidth >= 768;
      setIsDesktop(!isTouchDevice || isLargeScreen);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Listen for "?" key when not in an input (desktop only)
  useKeyboardShortcuts(
    { '?': toggle },
    { enabled: isDesktop, preventDefault: true }
  );

  return { isOpen, open, close, toggle };
}

export default KeyboardShortcutsHelp;

