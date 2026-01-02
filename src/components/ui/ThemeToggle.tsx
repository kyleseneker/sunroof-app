'use client';

/**
 * Theme toggle button component
 */

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/providers';
import { cn } from '@/lib';

interface ThemeToggleProps {
  /** Show all three options (dark/light/system) or just toggle */
  showSystemOption?: boolean;
  /** Additional class names */
  className?: string;
  /** Compact mode (icon only) */
  compact?: boolean;
}

export default function ThemeToggle({
  showSystemOption = false,
  className,
  compact = true,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (showSystemOption) {
    // Three-way toggle: Dark / Light / System
    return (
      <div
        className={cn(
          'flex items-center gap-1 p-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-base)]',
          className
        )}
        role="radiogroup"
        aria-label="Theme selection"
      >
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'p-2 rounded-full transition-all',
            theme === 'dark'
              ? 'bg-[var(--bg-muted)] text-[var(--fg-base)]'
              : 'text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]'
          )}
          role="radio"
          aria-checked={theme === 'dark'}
          aria-label="Dark theme"
        >
          <Moon className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'p-2 rounded-full transition-all',
            theme === 'light'
              ? 'bg-[var(--bg-muted)] text-[var(--fg-base)]'
              : 'text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]'
          )}
          role="radio"
          aria-checked={theme === 'light'}
          aria-label="Light theme"
        >
          <Sun className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setTheme('system')}
          className={cn(
            'p-2 rounded-full transition-all',
            theme === 'system'
              ? 'bg-[var(--bg-muted)] text-[var(--fg-base)]'
              : 'text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]'
          )}
          role="radio"
          aria-checked={theme === 'system'}
          aria-label="System theme"
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Simple toggle between dark and light
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-full transition-all',
        'bg-[var(--bg-surface)] border border-[var(--border-base)]',
        'text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:bg-[var(--bg-muted)]',
        'focus-ring',
        className
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      {!compact && (
        <span className="ml-2 text-sm">
          {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
}

