'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib';

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export default function Section({ 
  title, 
  children, 
  className,
  contentClassName,
  padding = 'md',
}: SectionProps) {
  return (
    <div className={cn('glass rounded-2xl', paddingStyles[padding], className)}>
      {title && (
        <h3 className="text-sm font-medium text-[var(--fg-muted)] mb-3">
          {title}
        </h3>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
}

/**
 * SectionRow - Clickable row within a Section (for settings, preferences, etc.)
 */
interface SectionRowProps {
  icon?: ReactNode;
  iconColor?: string;
  label: string;
  description?: string;
  onClick?: () => void;
  rightContent?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SectionRow({
  icon,
  iconColor = 'text-orange-400',
  label,
  description,
  onClick,
  rightContent,
  disabled = false,
  className,
}: SectionRowProps) {
  const Wrapper = onClick ? 'button' : 'div';
  
  return (
    <Wrapper
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-xl',
        'bg-[var(--bg-surface)]/50',
        onClick && !disabled && 'hover:bg-[var(--bg-muted)]/50 transition-colors cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className={cn('w-5 h-5', iconColor)}>
            {icon}
          </span>
        )}
        <div className="text-left">
          <span className="block text-[var(--fg-base)]">{label}</span>
          {description && (
            <span className="text-xs text-[var(--fg-muted)]">{description}</span>
          )}
        </div>
      </div>
      {rightContent}
    </Wrapper>
  );
}

