'use client';

import { cn } from '@/lib';

interface StatCardProps {
  value: number | string;
  label: string;
  color?: 'orange' | 'blue' | 'pink' | 'emerald' | 'purple' | 'amber';
  className?: string;
}

const colorStyles = {
  orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/10 text-orange-400',
  blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/10 text-blue-400',
  pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/10 text-pink-400',
  emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/10 text-emerald-400',
  purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/10 text-purple-400',
  amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/10 text-amber-400',
};

export default function StatCard({
  value,
  label,
  color = 'orange',
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      'text-center p-4 rounded-2xl border bg-gradient-to-br',
      colorStyles[color],
      className
    )}>
      <div className="text-3xl font-bold counter">{value}</div>
      <div className="text-xs text-[var(--fg-muted)] mt-1">{label}</div>
    </div>
  );
}

