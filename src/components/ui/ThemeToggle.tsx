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
    const isDark = resolvedTheme === 'dark';
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'w-12 h-7 rounded-full relative transition-colors',
          isDark ? 'bg-orange-500' : 'bg-[var(--bg-muted)]',
          className
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className={cn(
          'absolute top-1 w-5 h-5 rounded-full bg-[var(--fg-base)] transition-transform',
          isDark ? 'translate-x-6' : 'translate-x-1'
        )} />
      </button>
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

