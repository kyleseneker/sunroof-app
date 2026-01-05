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
    <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 z-50 flex flex-col safe-top safe-bottom overflow-hidden">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
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
            <Image src="/icon.svg" alt="Sunroof" width={28} height={28} className="brightness-0 invert opacity-80" />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/60">Sunroof</span>
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
          <h1 className="text-[42px] font-light tracking-tight leading-[1.1] text-white mb-6">
            Capture now.
            <br />
            <span className="text-white/40">Relive later.</span>
          </h1>
          
          <div className="w-10 h-px bg-white/20 mb-6" />
          
          <p className="text-white/60 text-[15px] leading-relaxed font-light">
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
            className="group w-full h-16 bg-white text-gray-900 font-semibold rounded-full flex items-center justify-between px-8 hover:bg-white/90 active:scale-[0.98] transition-all shadow-2xl"
          >
            <span className="text-[15px]">Get Started</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          
          <p className="text-center text-xs text-white/40 mt-4">
            Sign in with just your email
          </p>
        </div>
      </div>
    </div>
  );
}
