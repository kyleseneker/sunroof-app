'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  unlockDate: string | Date;
  onUnlock?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUnlocked: boolean;
}

function calculateTimeLeft(unlockDate: Date): TimeLeft {
  const now = new Date();
  const diff = unlockDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isUnlocked: true };
  }
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isUnlocked: false,
  };
}

export default function CountdownTimer({ unlockDate, onUnlock }: CountdownTimerProps) {
  const targetDate = typeof unlockDate === 'string' ? new Date(unlockDate) : unlockDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));
  
  useEffect(() => {
    // Update immediately
    setTimeLeft(calculateTimeLeft(targetDate));
    
    // Then update every second
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.isUnlocked) {
        clearInterval(interval);
        onUnlock?.();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate, onUnlock]);
  
  if (timeLeft.isUnlocked) {
    return (
      <div className="countdown-unlocked text-center py-4">
        <p className="text-2xl font-bold text-emerald-400">🎉 Unlocked!</p>
      </div>
    );
  }
  
  // Determine which units to show based on time remaining
  const showDays = timeLeft.days > 0;
  const showHours = timeLeft.days > 0 || timeLeft.hours > 0;
  const showMinutes = true;
  const showSeconds = timeLeft.days === 0; // Only show seconds in the last day
  
  return (
    <div className="countdown-timer">
      <div className="flex items-center justify-center gap-2">
        {showDays && (
          <>
            <CountdownBlock value={timeLeft.days} label="days" />
            <Separator />
          </>
        )}
        {showHours && (
          <>
            <CountdownBlock value={timeLeft.hours} label="hrs" />
            <Separator />
          </>
        )}
        {showMinutes && (
          <CountdownBlock value={timeLeft.minutes} label="min" />
        )}
        {showSeconds && (
          <>
            <Separator />
            <CountdownBlock value={timeLeft.seconds} label="sec" highlight />
          </>
        )}
      </div>
    </div>
  );
}

function CountdownBlock({ 
  value, 
  label, 
  highlight = false 
}: { 
  value: number; 
  label: string; 
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          countdown-block w-16 h-16 rounded-xl flex items-center justify-center
          bg-white/10 border border-white/10 backdrop-blur-sm
          ${highlight ? 'animate-pulse-subtle' : ''}
        `}
      >
        <span className="text-2xl font-bold tabular-nums text-white">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-white/50 mt-1.5">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center h-16 px-0.5">
      <span className="text-white/30 text-xl font-light">:</span>
    </div>
  );
}

