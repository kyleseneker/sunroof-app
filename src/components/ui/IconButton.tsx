'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib';

type IconButtonVariant = 'default' | 'ghost' | 'danger' | 'active';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  active?: boolean;
  icon: ReactNode;
  label: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'bg-[var(--bg-surface)] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg-base)]',
  ghost: 'bg-transparent text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg-base)]',
  danger: 'bg-[var(--bg-surface)] text-[var(--fg-muted)] hover:bg-red-500/20 hover:text-red-400',
  active: 'bg-orange-500/20 text-orange-400',
};

// Dark-mode friendly variants (for dark overlays like galleries)
const darkVariantStyles: Record<IconButtonVariant, string> = {
  default: 'bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white backdrop-blur-md',
  ghost: 'bg-transparent text-zinc-400 hover:bg-white/10 hover:text-white',
  danger: 'bg-white/10 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 backdrop-blur-md',
  active: 'bg-orange-500/20 text-orange-400 backdrop-blur-md',
};

const sizeStyles: Record<IconButtonSize, { button: string; icon: string }> = {
  sm: { button: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { button: 'w-10 h-10', icon: 'w-5 h-5' },
  lg: { button: 'w-12 h-12', icon: 'w-6 h-6' },
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps & { dark?: boolean }>(
  (
    {
      icon,
      label,
      variant = 'default',
      size = 'md',
      loading = false,
      active = false,
      dark = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const resolvedVariant = active ? 'active' : variant;
    const styles = dark ? darkVariantStyles : variantStyles;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-full',
          'transition-all duration-200',
          'focus:outline-none focus-ring',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95',
          sizeStyles[size].button,
          styles[resolvedVariant],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn(sizeStyles[size].icon, 'animate-spin')} aria-hidden="true" />
        ) : (
          <span className={sizeStyles[size].icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;

