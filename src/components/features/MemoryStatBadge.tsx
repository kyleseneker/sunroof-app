'use client';

import { ImageIcon, FileText, Mic } from 'lucide-react';

type MemoryType = 'photo' | 'note' | 'audio';

interface MemoryStatBadgeProps {
  type: MemoryType;
  count: number;
}

const CONFIG: Record<MemoryType, { icon: typeof ImageIcon; color: string }> = {
  photo: { icon: ImageIcon, color: 'text-pink-400' },
  note: { icon: FileText, color: 'text-blue-400' },
  audio: { icon: Mic, color: 'text-orange-400' },
};

export default function MemoryStatBadge({ type, count }: MemoryStatBadgeProps) {
  if (count === 0) return null;
  
  const { icon: Icon, color } = CONFIG[type];
  
  return (
    <span className="flex items-center gap-1 text-sm text-white/60">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span>{count}</span>
    </span>
  );
}

