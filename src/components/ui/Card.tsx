'use client';

/**
 * Card component for content containers
 */

import { ReactNode, forwardRef, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

const variantStyles = {
  default: 'bg-zinc-900/50 border-zinc-800',
  interactive: 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700 cursor-pointer transition-all',
  elevated: 'bg-zinc-900 border-zinc-800 shadow-xl shadow-black/20',
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
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl border
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${gradient ? 'relative overflow-hidden' : ''}
          ${className}
        `}
        {...props}
      >
        {gradient && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-pink-500/5 pointer-events-none"
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
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-zinc-800 p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-t border-zinc-800 p-4 ${className}`}>
      {children}
    </div>
  );
}
