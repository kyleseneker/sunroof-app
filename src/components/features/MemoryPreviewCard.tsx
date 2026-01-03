'use client';

import { Lock } from 'lucide-react';
import type { Memory } from '@/types';

// Fixed particle positions for consistent rendering
const PARTICLE_POSITIONS = [
  { left: 25, top: 30 },
  { left: 70, top: 25 },
  { left: 45, top: 55 },
  { left: 30, top: 70 },
  { left: 65, top: 60 },
];

interface MemoryPreviewCardProps {
  memories: Memory[];
  onTap: () => void;
}

export default function MemoryPreviewCard({ memories, onTap }: MemoryPreviewCardProps) {
  if (memories.length === 0) return null;

  return (
    <div className="relative z-10 flex-1 flex items-center justify-center p-6 pt-2">
      <button 
        onClick={onTap}
        className="memory-preview-card relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 group active:scale-[0.98] transition-transform"
      >
        {/* Blurred memory grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5">
          {memories.slice(0, 6).map((memory, index) => (
            <MemoryTile key={memory.id} memory={memory} index={index} />
          ))}
          {/* Fill empty slots if less than 6 memories */}
          {memories.length < 6 && [...Array(6 - Math.min(memories.length, 6))].map((_, i) => (
            <div key={`empty-${i}`} className="bg-white/5" />
          ))}
        </div>
        
        {/* Frosted overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* Lock icon in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 lock-pulse">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-white/80 font-medium text-sm">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} sealed
          </p>
          <p className="text-white/40 text-xs mt-1 group-hover:text-white/60 transition-colors">
            Tap to preview
          </p>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PARTICLE_POSITIONS.map((pos, i) => (
            <div
              key={i}
              className="vault-particle"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                animationDelay: `${i * 1.2}s`,
              }}
            />
          ))}
        </div>
      </button>
    </div>
  );
}

// Individual memory tile component
function MemoryTile({ memory, index }: { memory: Memory; index: number }) {
  return (
    <div 
      className="memory-tile relative overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {memory.type === 'photo' && memory.url ? (
        <img 
          src={memory.url} 
          alt=""
          className="w-full h-full object-cover blur-[20px] scale-125"
        />
      ) : memory.type === 'audio' ? (
        <div className="w-full h-full bg-gradient-to-br from-orange-500/40 to-pink-500/40" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500/40 to-purple-500/40" />
      )}
    </div>
  );
}

