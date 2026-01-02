'use client';

import { X, Sparkles, Camera, Lock, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)]/90 backdrop-blur-md flex flex-col safe-top safe-bottom">
      <div className="flex-1 flex flex-col p-6 animate-enter overflow-y-auto">
        <button 
          onClick={onClose}
          className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-hover)] mb-6"
        >
          <X className="w-5 h-5 text-[var(--fg-muted)]" />
        </button>
        
        <div className="max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/icon.svg" alt="Sunroof" width={32} height={32} />
            <h2 className="text-2xl font-light">How Sunroof Works</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">1. Start a Journey</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                  Create a new journey before you go. Choose when your memories unlock.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">2. Capture Moments</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                  Take photos and write notes during your journey. They go straight to the vault, no peeking!
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">3. Wait for Unlock</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                  Your memories stay hidden until the timer expires. Stay present and enjoy the moment.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">4. Relive the Magic</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                  When time&apos;s up, open your vault and rediscover your journey. It&apos;s like developing film!
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full h-14 bg-[var(--fg-base)] text-[var(--fg-inverse)] rounded-full font-semibold text-sm mt-10"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

