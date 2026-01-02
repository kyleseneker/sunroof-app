'use client';

/**
 * Card component for content containers
 */

import { ReactNode, forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

const variantStyles = {
  default: 'bg-[var(--bg-surface)]/50 border-[var(--border-base)]',
  interactive: 'bg-[var(--bg-surface)]/50 border-[var(--border-base)] hover:bg-[var(--bg-muted)]/50 hover:border-[var(--border-base)] cursor-pointer transition-all',
  elevated: 'bg-[var(--bg-surface)] border-[var(--border-base)] shadow-[var(--shadow-xl)]',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      gradient = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border',
          variantStyles[variant],
          paddingStyles[padding],
          gradient && 'relative overflow-hidden',
          className
        )}
        {...props}
      >
        {gradient && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 via-transparent to-[var(--color-gradient-mid)]/5 pointer-events-none"
            aria-hidden="true"
          />
        )}
        <div className={gradient ? 'relative' : ''}>{children}</div>
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-[var(--border-base)] p-4', className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-t border-[var(--border-base)] p-4', className)}>
      {children}
    </div>
  );
}
