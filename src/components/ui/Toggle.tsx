'use client';

import { cn } from '@/lib';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  activeColor?: string;
  className?: string;
  label?: string;
}

const sizeStyles = {
  sm: { track: 'w-10 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' },
  md: { track: 'w-12 h-7', thumb: 'w-5 h-5', translate: 'translate-x-6' },
};

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  activeColor = 'bg-orange-500',
  className,
  label,
}: ToggleProps) {
  const styles = sizeStyles[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        styles.track,
        'rounded-full relative transition-colors cursor-pointer',
        'focus:outline-none focus-ring',
        checked ? activeColor : 'bg-[var(--bg-muted)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div 
        className={cn(
          'absolute top-1 rounded-full bg-white transition-transform',
          styles.thumb,
          checked ? styles.translate : 'translate-x-1'
        )} 
      />
    </button>
  );
}

