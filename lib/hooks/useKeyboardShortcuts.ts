'use client';

/**
 * Hook for handling keyboard shortcuts
 */

import { useEffect, useCallback } from 'react';

type KeyHandler = () => void;

interface ShortcutMap {
  [key: string]: KeyHandler;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const parts: string[] = [];
      if (event.ctrlKey) parts.push('ctrl');
      if (event.metaKey) parts.push('cmd');
      if (event.altKey) parts.push('alt');
      if (event.shiftKey) parts.push('shift');
      parts.push(event.key.toLowerCase());

      const combo = parts.join('+');

      if (shortcuts[combo]) {
        if (preventDefault) event.preventDefault();
        shortcuts[combo]();
        return;
      }

      if (shortcuts[event.key]) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        if (preventDefault) event.preventDefault();
        shortcuts[event.key]();
      }
    },
    [shortcuts, enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;
