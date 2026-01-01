'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Reusable skeleton loading placeholder component.
 * Provides visual feedback during async data loading.
 */
export default function Skeleton({
  className = '',
  variant = 'default',
  width,
  height,
  lines = 1,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-zinc-800';
  
  const animationClasses = {
    pulse: 'skeleton', // Uses existing shimmer animation from globals.css
    wave: 'animate-pulse',
    none: '',
  };

  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  // For text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]}`}
            style={{
              ...style,
              // Make last line shorter for more natural look
              width: i === lines - 1 ? '75%' : style.width,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Preset skeleton patterns for common use cases
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-zinc-900/50 p-4 ${className}`}>
      <Skeleton variant="rectangular" height={120} className="mb-4" />
      <Skeleton variant="text" width="60%" className="mb-2" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
}

export function SkeletonJourneyCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden bg-zinc-900/50 ${className}`}>
      <Skeleton variant="rectangular" height={160} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="70%" height={20} />
        <Skeleton variant="text" width="50%" height={14} />
      </div>
    </div>
  );
}

export function SkeletonMemoryGrid({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          className="aspect-square"
          animation="pulse"
        />
      ))}
    </div>
  );
}

export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 ${className}`}>
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonProfile({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Skeleton variant="circular" width={96} height={96} className="mb-4" />
      <Skeleton variant="text" width={120} height={24} className="mb-2" />
      <Skeleton variant="text" width={180} height={14} />
    </div>
  );
}

