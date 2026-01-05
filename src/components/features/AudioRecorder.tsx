'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { MAX_AUDIO_DURATION_SECONDS } from '@/lib';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ 
  onRecordingComplete, 
  onError,
  disabled = false 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0));
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Update waveform visualization
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);

    // Sample frequencies for waveform bars
    const samples = 40;
    const step = Math.floor(dataArray.length / samples);
    const newWaveform = [];
    for (let i = 0; i < samples; i++) {
      const value = dataArray[i * step] / 255;
      newWaveform.push(value);
    }
    setWaveformData(newWaveform);

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [isRecording]);

  const startRecording = async () => {
    if (disabled) return;

    setIsPreparing(true);
    setPermissionDenied(false);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;

      // Set up audio analysis for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] });
        const finalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
        onRecordingComplete(blob, finalDuration);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        
        setWaveformData(Array(40).fill(0));
        setAudioLevel(0);
        setDuration(0);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPreparing(false);

      // Start waveform animation
      updateWaveform();

      // Duration counter
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_AUDIO_DURATION_SECONDS) {
          stopRecording();
        }
      }, 100);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

    } catch (err) {
      console.error('Microphone access error:', err);
      setIsPreparing(false);
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        onError('Microphone access denied');
      } else {
        onError('Could not access microphone');
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    }
    setIsRecording(false);
    setIsPreparing(false);
  }, []);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-light text-white mb-3">Microphone Access Denied</h3>
        <p className="text-white/50 text-sm mb-8 max-w-xs">
          Please enable microphone access in your browser settings to record voice notes.
        </p>
        <button
          onClick={() => setPermissionDenied(false)}
          className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold text-sm shadow-2xl active:scale-[0.98] transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6">
      {/* Waveform Visualization */}
      <div className="w-full max-w-xs h-28 flex items-center justify-center gap-[3px] mb-8">
        {waveformData.map((value, index) => (
          <div
            key={index}
            className="w-1.5 rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(8, value * 100)}px`,
              backgroundColor: isRecording 
                ? `rgba(251, 146, 60, ${0.4 + value * 0.6})` // Orange when recording
                : 'rgba(255, 255, 255, 0.2)', // White/transparent when idle
            }}
          />
        ))}
      </div>

      {/* Duration Display */}
      <div className="mb-8 text-center">
        <span className={`text-5xl font-light tabular-nums ${isRecording ? 'text-orange-400' : 'text-white/50'}`}>
          {formatDuration(duration)}
        </span>
        {isRecording && (
          <p className="text-xs text-white/40 text-center mt-3">
            Max {MAX_AUDIO_DURATION_SECONDS}s
          </p>
        )}
      </div>

      {/* Record Button */}
      <div className="relative">
        {/* Pulsing ring when recording */}
        {isRecording && (
          <div 
            className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"
            style={{ animationDuration: '1.5s' }}
          />
        )}
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isPreparing}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl ${
            isRecording 
              ? 'bg-gradient-to-br from-orange-500 to-amber-500' 
              : 'bg-white'
          } ${disabled || isPreparing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPreparing ? (
            <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8 text-white" fill="white" />
          ) : (
            <Mic className="w-8 h-8 text-gray-900" />
          )}
        </button>
      </div>

      {/* Instructions */}
      <p className="text-sm text-white/40 mt-8 text-center">
        {isRecording 
          ? 'Tap to stop recording' 
          : 'Tap to start recording'}
      </p>
    </div>
  );
}

