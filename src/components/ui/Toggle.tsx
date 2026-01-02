'use client';

import { cn } from '@/lib';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  className?: string;
  label?: string;
}

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  activeColor = 'bg-orange-500',
  className,
  label,
}: ToggleProps) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={disabled ? undefined : () => onChange(!checked)}
      className={cn(
        'w-12 h-7 rounded-full relative transition-colors cursor-pointer',
        checked ? activeColor : 'bg-[var(--bg-muted)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div 
        className={cn(
          'absolute top-1 w-5 h-5 rounded-full bg-[var(--fg-base)] transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )} 
      />
    </div>
  );
}
