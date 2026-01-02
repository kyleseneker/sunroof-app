'use client';
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Intro({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 200),
      setTimeout(() => setStep(2), 600),
      setTimeout(() => setStep(3), 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col safe-top safe-bottom overflow-hidden">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-orange-500/20 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col justify-between p-8 pb-10 relative z-10">
        
        {/* Top: Brand */}
        <div 
          className="transition-all duration-1000 ease-out"
          style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
          <div className="flex items-center gap-3">
            <Image src="/icon.svg" alt="Sunroof" width={28} height={28} />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-zinc-400">Sunroof</span>
          </div>
        </div>

        {/* Middle: Value Prop */}
        <div 
          className="max-w-xs transition-all duration-1000 ease-out"
          style={{
            opacity: step >= 2 ? 1 : 0,
            transform: step >= 2 ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <h1 className="text-[42px] font-light tracking-tight leading-[1.1] mb-6">
            Capture now.
            <br />
            <span className="text-zinc-600">Relive later.</span>
          </h1>
          
          <div className="w-10 h-px bg-zinc-800 mb-6" />
          
          <p className="text-zinc-400 text-[15px] leading-relaxed font-light">
            Your memories stay locked until you&apos;re ready. 
            No peeking. No editing. Just moments waiting to be rediscovered.
          </p>
        </div>

        {/* Bottom: CTA */}
        <div 
          className="transition-all duration-1000 ease-out"
          style={{
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
          <button 
            onClick={onComplete}
            className="group w-full h-16 bg-white text-black font-semibold rounded-full flex items-center justify-between px-8 hover:bg-zinc-100 active:scale-[0.98] transition-all"
          >
            <span className="text-[15px]">Get Started</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          
          <p className="text-center text-xs text-zinc-600 mt-4">
            Sign in with just your email
          </p>
        </div>
      </div>
    </div>
  );
}
