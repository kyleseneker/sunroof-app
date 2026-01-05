'use client';

import { ReactNode } from 'react';
import { X, Sparkles, Camera, Lock, ImageIcon } from 'lucide-react';
import { FeatureStep, IconButton, Button } from '@/components/ui';
import Image from 'next/image';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function HelpModal({ isOpen, onClose, children }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Unified warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <IconButton 
          icon={<X className="w-5 h-5" />} 
          label="Close" 
          onClick={onClose} 
          variant="ghost"
          dark 
        />
      </header>
      
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-6 animate-enter overflow-y-auto scrollbar-hide">
        <div className="max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/icon.svg" alt="Sunroof" width={32} height={32} className="brightness-0 invert" />
            <h2 className="text-2xl font-light text-white">How Sunroof Works</h2>
          </div>
          
          <div className="space-y-6">
            <FeatureStep
              icon={<Sparkles className="w-5 h-5" />}
              iconBgColor="bg-emerald-500/10"
              iconColor="text-emerald-400"
              title="1. Start a Journey"
              description="Create a new journey before you go. Choose when your memories unlock."
            />
            
            <FeatureStep
              icon={<Camera className="w-5 h-5" />}
              iconBgColor="bg-blue-500/10"
              iconColor="text-blue-400"
              title="2. Capture Moments"
              description="Take photos, record audio, and write notes during your journey. They go straight to the Vault, no peeking!"
            />
            
            <FeatureStep
              icon={<Lock className="w-5 h-5" />}
              iconBgColor="bg-amber-500/10"
              iconColor="text-amber-400"
              title="3. Wait for Unlock"
              description="Your memories stay hidden until the timer expires. Stay present and enjoy the moment."
            />
            
            <FeatureStep
              icon={<ImageIcon className="w-5 h-5" />}
              iconBgColor="bg-pink-500/10"
              iconColor="text-pink-400"
              title="4. Relive the Magic"
              description="When time's up, open your Vault and rediscover your journey. It's like developing film!"
            />
          </div>

          {children}

          <Button onClick={onClose} fullWidth size="lg" className="mt-10">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

