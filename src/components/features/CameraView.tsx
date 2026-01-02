'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { compressImage, getCompressionStats, getTimeOfDay, NOTE_PROMPTS, MAX_FILE_SIZE_BYTES, MAX_NOTE_LENGTH, ALLOWED_IMAGE_TYPES, IMAGE_COMPRESSION } from '@/lib';
import { getCurrentUser, uploadMemoryPhoto, createMemory } from '@/services';
import { X, Camera, FileText, Send, Check, Loader2, Upload, Video, VideoOff, Sparkles } from 'lucide-react';
import type { TimeOfDay } from '@/types';

export default function CameraView({ 
  journeyId, 
  journeyName, 
  onClose 
}: { 
  journeyId: string; 
  journeyName: string; 
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get contextual prompts - use useState to avoid calling Math.random during render
  const [prompts] = useState<readonly string[]>(() => {
    const timeOfDay = getTimeOfDay() as TimeOfDay;
    const timePrompts = NOTE_PROMPTS[timeOfDay];
    // Pick first 3 prompts (deterministic)
    return timePrompts.slice(0, 3);
  });
  
  // Desktop webcam support
  const [isDesktop, setIsDesktop] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  

  const showSuccess = () => {
    // Haptic feedback on success
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  // Get user ID for storage paths
  useEffect(() => {
    getCurrentUser().then(({ data: user }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [loading, onClose]);

  // Detect if user is on desktop (no touch support or large screen)
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLargeScreen = window.innerWidth >= 1024;
    setIsDesktop(!isTouchDevice || isLargeScreen);
  }, []);

  // Start webcam for desktop
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      });
      streamRef.current = stream;
      
      // Attach stream to video element (it's always in DOM now)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error('Video play error:', err);
        });
      }
      
      setWebcamActive(true);
    } catch (err) {
      console.error('Webcam error:', err);
      setWebcamError('Camera access denied or unavailable');
      setWebcamActive(false);
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
  }, []);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  // Capture photo from webcam
  const captureFromWebcam = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is actually playing and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera not ready. Please wait.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Failed to capture');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Flip horizontally for selfie camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    
    setLoading(true);
    setError(null);
    
    // Convert to blob, compress, and upload
    try {
      const rawBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });
      
      if (!rawBlob) {
        setError('Failed to capture photo');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        return;
      }
      
      // Compress the image
      const blob = await compressImage(rawBlob, IMAGE_COMPRESSION);
      
      const stats = getCompressionStats(rawBlob.size, blob.size);
      console.log(`Image compressed: ${stats.originalKB}KB → ${stats.compressedKB}KB (saved ${stats.percentage}%)`);
      
      if (!userId) {
        setError('Not authenticated');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        return;
      }
      
      // Upload photo
      const { data: uploadData, error: uploadError } = await uploadMemoryPhoto(userId, journeyId, blob);

      if (uploadError || !uploadData) {
        console.error('Upload error:', uploadError);
        setError(`Upload failed: ${uploadError || 'Unknown error'}`);
        setTimeout(() => setError(null), 4000);
        setLoading(false);
        return;
      }
      
      console.log('Upload successful:', uploadData);

      // Create memory record
      const { error: insertError } = await createMemory({
        journeyId,
        type: 'photo',
        imageUrl: uploadData.publicUrl,
      });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to save memory. Try again.');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      showSuccess();
    } catch (err) {
      console.error('Capture exception:', err);
      setError('Something went wrong. Try again.');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Image is too large (max 10MB)');
      setTimeout(() => setError(null), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // Validate file type (flexible for HEIC on iOS)
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number]) || file.type === '' || file.name.match(/\.(jpe?g|png|gif|webp|heic|heif)$/i);
    if (!isValidType) {
      setError('Unsupported image format');
      setTimeout(() => setError(null), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // Haptic feedback on shutter
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    
    setLoading(true);
    setError(null);
    
    if (!userId) {
      setError('Not authenticated');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
      return;
    }
    
    try {
      // Compress the image before upload
      const compressedBlob = await compressImage(file, IMAGE_COMPRESSION);
      
      const stats = getCompressionStats(file.size, compressedBlob.size);
      console.log(`Image compressed: ${stats.originalKB}KB → ${stats.compressedKB}KB (saved ${stats.percentage}%)`);
      
      // Upload photo
      const { data: uploadData, error: uploadError } = await uploadMemoryPhoto(userId, journeyId, compressedBlob);

      if (uploadError || !uploadData) {
        console.error('Upload error:', uploadError);
        setError('Upload failed. Check your connection.');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Create memory record
      const { error: insertError } = await createMemory({
        journeyId,
        type: 'photo',
        imageUrl: uploadData.publicUrl,
      });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to save memory. Try again.');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setLoading(false);
      showSuccess();
    } catch (err) {
      console.error('Capture exception:', err);
      setError('Something went wrong. Try again.');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNote = async () => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return;
    
    if (trimmedNote.length > MAX_NOTE_LENGTH) {
      setError(`Note is too long (max ${MAX_NOTE_LENGTH.toLocaleString()} characters)`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: insertError } = await createMemory({
        journeyId,
        type: 'note',
        content: trimmedNote,
      });
      
      if (insertError) {
        console.error('Note insert error:', insertError);
        setError('Failed to save note. Try again.');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setNote('');
      setMode('photo');
      showSuccess();
    } catch (err) {
      console.error('Note exception:', err);
      setError('Something went wrong. Try again.');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col safe-top safe-bottom">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 safe-top">
        <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase">{journeyName}</span>
          </div>
          
          <div className="w-10" />
        </div>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-enter">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Saved to vault</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-enter">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 backdrop-blur-md">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Viewfinder Area */}
      <div className="flex-1 relative bg-zinc-950">
        {mode === 'photo' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Desktop webcam view - always rendered but hidden when not active */}
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isDesktop && webcamActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ transform: 'scaleX(-1)' }} // Mirror for selfie view
            />
            
            {/* Canvas for capturing (hidden) */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Subtle frame guide */}
            <div className="w-72 h-72 border border-white/10 rounded-3xl z-10" />
            
            {/* Corner accents */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none z-10">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-white/30 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-white/30 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-white/30 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-white/30 rounded-br-xl" />
            </div>
            
            {/* Desktop: Show webcam instructions or error */}
            {isDesktop && !webcamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-zinc-950/80">
                {webcamError ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                      <VideoOff className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-zinc-400 text-sm mb-6 text-center px-8">{webcamError}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-white text-black rounded-full font-medium text-sm flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Photo Instead
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Video className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-zinc-400 text-sm mb-6 text-center px-8">Use your webcam or upload a photo</p>
                    <div className="flex gap-3">
                      <button
                        onClick={startWebcam}
                        className="px-6 py-3 bg-white text-black rounded-full font-medium text-sm flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Start Webcam
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-zinc-800 text-white rounded-full font-medium text-sm flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 pt-24 pb-48 px-6 flex flex-col">
            {/* Note icon header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 opacity-50">
                <FileText className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wider">Write a memory</span>
              </div>
              {/* Toggle prompts */}
              {showPrompts && prompts.length > 0 && !note && (
                <button
                  onClick={() => setShowPrompts(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Hide prompts
                </button>
              )}
            </div>
            
            {/* Smart prompts - only show when empty */}
            {showPrompts && !note && prompts.length > 0 && (
              <div className="mb-6 space-y-2 animate-enter">
                <div className="flex items-center gap-2 text-xs text-purple-400 mb-3">
                  <Sparkles className="w-3 h-3" />
                  <span>Need inspiration?</span>
                </div>
                {prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setNote(prompt + '\n\n');
                      setShowPrompts(false);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all text-sm"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            
            <textarea 
              autoFocus
              placeholder="What do you want to remember?"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (e.target.value) setShowPrompts(false);
              }}
              maxLength={10000}
              className="flex-1 w-full bg-transparent text-xl font-light text-white placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
            />
            {/* Character hint */}
            {note.length > 500 && (
              <div className="text-xs text-zinc-600 text-right">
                {note.length.toLocaleString()} characters
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 safe-bottom">
        <div className="p-6 pt-8 bg-gradient-to-t from-black via-black/90 to-transparent">
          
          {/* Mode Switcher */}
          <div className="flex justify-center gap-8 mb-6">
            <button 
              onClick={() => setMode('photo')}
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === 'photo' ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <Camera className="w-4 h-4" />
              Photo
            </button>
            <button 
              onClick={() => setMode('text')}
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === 'text' ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <FileText className="w-4 h-4" />
              Note
            </button>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            {loading ? (
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
              </div>
            ) : mode === 'photo' ? (
              <>
                {/* File input for mobile camera capture or desktop file upload */}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture={isDesktop ? undefined : "environment"}
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleCapture} 
                />
                
                {/* Desktop with active webcam: show capture button */}
                {isDesktop && webcamActive ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={stopWebcam}
                      className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                      title="Stop webcam"
                    >
                      <VideoOff className="w-5 h-5 text-zinc-400" />
                    </button>
                    <button 
                      onClick={captureFromWebcam}
                      className="w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center active:scale-95 transition-transform group"
                    >
                      <div className="w-16 h-16 bg-white rounded-full group-active:bg-zinc-200 transition-colors" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                      title="Upload instead"
                    >
                      <Upload className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
                ) : isDesktop && !webcamActive ? (
                  // Desktop without webcam: just show invisible trigger (buttons are in viewfinder)
                  <div className="w-20 h-20" />
                ) : (
                  // Mobile: standard camera capture button
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center active:scale-95 transition-transform group"
                  >
                    <div className="w-16 h-16 bg-white rounded-full group-active:bg-zinc-200 transition-colors" />
                  </button>
                )}
              </>
            ) : (
              <button 
                onClick={handleNote}
                disabled={!note.trim()}
                className="h-14 px-8 bg-white text-black rounded-full font-semibold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                Save Note
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
