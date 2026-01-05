'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { IconButton } from '@/components/ui';

interface AudioPlayerProps {
  src: string;
  duration?: number | null;
  className?: string;
  showWaveform?: boolean;
}

export default function AudioPlayer({ 
  src, 
  duration: initialDuration,
  className = '',
  showWaveform = true 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Generate pseudo-random waveform based on URL (deterministic)
  useEffect(() => {
    const generateWaveform = () => {
      const bars = 50;
      const seed = src.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const data = [];
      for (let i = 0; i < bars; i++) {
        // Generate pseudo-random values between 0.2 and 1
        const value = 0.2 + (Math.sin(seed + i * 0.5) * 0.5 + 0.5) * 0.8;
        data.push(value);
      }
      setWaveformData(data);
    };
    generateWaveform();
  }, [src]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError(true);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`flex items-center justify-center p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl ${className}`}>
        <p className="text-white/50 text-sm">Failed to load audio</p>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Waveform Visualization */}
      {showWaveform && (
        <div 
          ref={progressRef}
          onClick={handleProgressClick}
          className="w-full h-16 flex items-center gap-[2px] mb-4 cursor-pointer"
        >
          {waveformData.map((value, index) => {
            const barProgress = (index / waveformData.length) * 100;
            const isPlayed = barProgress <= progress;
            
            return (
              <div
                key={index}
                className="flex-1 rounded-full transition-colors duration-150"
                style={{
                  height: `${value * 100}%`,
                  backgroundColor: isPlayed 
                    ? 'rgb(251, 191, 36)' // Amber for played
                    : 'rgba(255, 255, 255, 0.2)', // White for unplayed
                }}
              />
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isPlaying 
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30' 
              : 'bg-white hover:bg-white/90'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white" fill="white" />
          ) : (
            <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Time Display */}
        <div className="flex-1">
          <div className="flex justify-between text-sm tabular-nums">
            <span className="text-white">{formatTime(currentTime)}</span>
            <span className="text-white/40">{formatTime(duration)}</span>
          </div>
          
          {/* Simple progress bar (for non-waveform mode) */}
          {!showWaveform && (
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              className="h-1 bg-white/10 rounded-full mt-2 cursor-pointer overflow-hidden"
            >
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Mute Button */}
        <IconButton 
          icon={isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          label={isMuted ? 'Unmute' : 'Mute'}
          onClick={toggleMute}
          variant="ghost"
          dark
        />
      </div>
    </div>
  );
}
