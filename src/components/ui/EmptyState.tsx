'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib';

type EmptyStateVariant = 'default' | 'centered' | 'inline';

interface EmptyStateProps {
  icon: ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
}

export default function EmptyState({
  icon,
  iconColor = 'text-zinc-600',
  iconBgColor = 'bg-zinc-800',
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const variantStyles: Record<EmptyStateVariant, string> = {
    default: 'py-16',
    centered: 'h-full flex-1 py-16',
    inline: 'py-8',
  };

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variantStyles[variant],
        className
      )}
    >
      {/* Icon circle */}
      <div className={cn(
        'relative w-20 h-20 mb-6 rounded-full flex items-center justify-center',
        iconBgColor
      )}>
        <div className={cn('w-8 h-8', iconColor)}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <p className="text-lg text-[var(--fg-muted)] mb-2">{title}</p>

      {/* Description */}
      {description && (
        <p className="text-sm text-[var(--fg-subtle)] max-w-xs">{description}</p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

