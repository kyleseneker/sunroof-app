'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers';
import { cn } from '@/lib';
import { Toggle } from '@/components/ui';

interface ThemeToggleProps {
  showSystemOption?: boolean;
  className?: string;
  compact?: boolean;
}

export default function ThemeToggle({
  showSystemOption = false,
  className,
  compact = true,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (showSystemOption) {
    return (
      <Toggle
        checked={isDark}
        onChange={toggleTheme}
        label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={className}
      />
    );
  }

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
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {!compact && (
        <span className="ml-2 text-sm">{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  );
}

