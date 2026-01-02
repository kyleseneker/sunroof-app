'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib';

interface FeatureStepProps {
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureStep({
  icon,
  iconBgColor = 'bg-zinc-800',
  iconColor = 'text-zinc-400',
  title,
  description,
  className,
}: FeatureStepProps) {
  return (
    <div className={cn('flex gap-4', className)}>
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
        iconBgColor
      )}>
        <span className={cn('w-5 h-5', iconColor)}>
          {icon}
        </span>
      </div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

