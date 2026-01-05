'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { compressImage, getCompressionStats, getTimeOfDay, NOTE_PROMPTS, PHOTO_FILTERS, type PhotoFilterKey, type TimeOfDay, MAX_FILE_SIZE_BYTES, MAX_NOTE_LENGTH, ALLOWED_IMAGE_TYPES, IMAGE_COMPRESSION, getLocationContext, getWeather } from '@/lib';
import type { MemoryLocation, MemoryWeather } from '@/types';
import { getCurrentUser, uploadMemoryPhoto, uploadMemoryAudio, createMemory } from '@/services';
import { X, Camera, FileText, Send, Check, Loader2, Upload, Sparkles, Mic, SwitchCamera, ImageIcon, Palette } from 'lucide-react';
import { AudioRecorder, FilterSelector } from '@/components/features';
import { IconButton } from '@/components/ui';

export type CaptureMode = 'photo' | 'text' | 'audio';

export default function CameraView({ 
  journeyId, 
  journeyName, 
  onClose,
  initialMode = 'photo',
}: { 
  journeyId: string; 
  journeyName: string; 
  onClose: () => void;
  initialMode?: CaptureMode;
}) {
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get contextual prompts - use useState to avoid calling Math.random during render
  const [prompts] = useState<readonly string[]>(() => {
    const timeOfDay = getTimeOfDay() as TimeOfDay;
    const timePrompts = NOTE_PROMPTS[timeOfDay];
    // Pick first 3 prompts (deterministic)
    return timePrompts.slice(0, 3);
  });
  
  // Camera state (unified for mobile and desktop)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Track if device has multiple cameras
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [supportsZoom, setSupportsZoom] = useState(false);
  const lastPinchDistance = useRef<number | null>(null);
  
  // Location & weather context (captured on mount)
  const [locationContext, setLocationContext] = useState<MemoryLocation | null>(null);
  const [weatherContext, setWeatherContext] = useState<MemoryWeather | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  
  // Photo preview & filter state
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilterKey>('none');
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);
  

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

  // Fetch location and weather context on mount
  useEffect(() => {
    async function fetchContext() {
      try {
        // Get location first
        const location = await getLocationContext();
        setLocationContext(location);
        
        // If we have location, fetch weather
        if (location) {
          const weather = await getWeather(location.latitude, location.longitude);
          setWeatherContext(weather);
        }
      } catch (err) {
        console.warn('[CameraView] Context fetch error:', err);
      } finally {
        setContextLoading(false);
      }
    }
    fetchContext();
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

  // Check for multiple cameras (initial check on mount)
  const checkForMultipleCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const videoDevices = devices?.filter(d => d.kind === 'videoinput') || [];
      setHasMultipleCameras(videoDevices.length > 1);
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    checkForMultipleCameras();
  }, [checkForMultipleCameras]);

  // Start camera (works on both mobile and desktop)
  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      setCameraReady(false);
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false 
      });
      streamRef.current = stream;
      
      // Check zoom capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { 
            zoom?: { min: number; max: number } 
          };
          if (capabilities?.zoom) {
            setSupportsZoom(true);
            setMinZoom(capabilities.zoom.min || 1);
            setMaxZoom(capabilities.zoom.max || 1);
            setZoomLevel(1);
          } else {
            setSupportsZoom(false);
          }
        } catch {
          setSupportsZoom(false);
        }
      }
      
      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true);
          }).catch(err => {
            console.error('Video play error:', err);
          });
        };
      }
      
      setCameraActive(true);
      setFacingMode(facing);
      
      // Re-check for multiple cameras after permission is granted
      checkForMultipleCameras();
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please enable in settings.');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not access camera.');
      }
      setCameraActive(false);
    }
  }, [facingMode, checkForMultipleCameras]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  }, []);

  // Flip camera (toggle front/back)
  const flipCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setZoomLevel(1); // Reset zoom when flipping
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Apply zoom level to camera
  const applyZoom = useCallback((level: number) => {
    if (!streamRef.current || !supportsZoom) return;
    
    const clampedLevel = Math.max(minZoom, Math.min(maxZoom, level));
    const videoTrack = streamRef.current.getVideoTracks()[0];
    
    if (videoTrack) {
      try {
        videoTrack.applyConstraints({
          // @ts-expect-error - zoom is not in the standard types yet
          advanced: [{ zoom: clampedLevel }]
        });
        setZoomLevel(clampedLevel);
      } catch (err) {
        console.error('Zoom error:', err);
      }
    }
  }, [supportsZoom, minZoom, maxZoom]);

  // Pinch-to-zoom handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDistance.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null && supportsZoom) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const delta = distance - lastPinchDistance.current;
      const zoomSpeed = 0.01;
      const newZoom = zoomLevel + (delta * zoomSpeed);
      
      applyZoom(newZoom);
      lastPinchDistance.current = distance;
    }
  }, [supportsZoom, zoomLevel, applyZoom]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  // Auto-start camera when entering photo mode
  useEffect(() => {
    if (mode === 'photo' && !cameraActive && !cameraError) {
      startCamera();
    }
    // Stop camera when leaving photo mode
    if (mode !== 'photo' && cameraActive) {
      stopCamera();
    }
  }, [mode, cameraActive, cameraError, startCamera, stopCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture photo from camera
  const capturePhoto = useCallback(async () => {
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
    
    // Only flip horizontally for front-facing (selfie) camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    // Apply selected filter
    ctx.filter = PHOTO_FILTERS[selectedFilter].filter;
    ctx.drawImage(video, 0, 0);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    
    setLoading(true);
    setError(null);
    
    // Convert to blob and upload directly (filter already applied)
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
      
      // Upload photo directly (filter was applied to canvas)
      const { data: uploadData, error: uploadError } = await uploadMemoryPhoto(userId, journeyId, blob);

      if (uploadError || !uploadData) {
        console.error('Upload error:', uploadError);
        setError(`Upload failed: ${uploadError || 'Unknown error'}`);
        setTimeout(() => setError(null), 4000);
        setLoading(false);
        return;
      }
      
      console.log('Upload successful:', uploadData);

      // Create memory record with location and weather
      const { error: insertError } = await createMemory({
        journeyId,
        type: 'photo',
        imageUrl: uploadData.publicUrl,
        latitude: locationContext?.latitude,
        longitude: locationContext?.longitude,
        locationName: locationContext?.name,
        weather: weatherContext || undefined,
      });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to save memory. Try again.');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        return;
      }
      
      // Reset filter for next photo
      setSelectedFilter('none');
      setLoading(false);
      showSuccess();
    } catch (err) {
      console.error('Capture exception:', err);
      setError('Something went wrong. Try again.');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId, facingMode, userId, locationContext, weatherContext, selectedFilter]);

  // Apply filter and upload the photo
  const savePhotoWithFilter = useCallback(async () => {
    if (!previewBlob || !previewUrl || !userId) {
      setError('Photo not ready');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let finalBlob = previewBlob;
      
      // Apply filter if not 'none'
      if (selectedFilter !== 'none') {
        const filterValue = PHOTO_FILTERS[selectedFilter].filter;
        
        // Create an image element to draw
        const img = new Image();
        img.src = previewUrl;
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
        });
        
        // Create canvas and apply filter
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.filter = filterValue;
          ctx.drawImage(img, 0, 0);
          
          // Convert back to blob
          finalBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            }, 'image/jpeg', 0.92);
          });
        }
      }
      
      // Upload photo
      const { data: uploadData, error: uploadError } = await uploadMemoryPhoto(userId, journeyId, finalBlob);

      if (uploadError || !uploadData) {
        console.error('Upload error:', uploadError);
        setError(`Upload failed: ${uploadError || 'Unknown error'}`);
        setTimeout(() => setError(null), 4000);
        setLoading(false);
        return;
      }
      
      console.log('Upload successful:', uploadData);

      // Create memory record with location and weather
      const { error: insertError } = await createMemory({
        journeyId,
        type: 'photo',
        imageUrl: uploadData.publicUrl,
        latitude: locationContext?.latitude,
        longitude: locationContext?.longitude,
        locationName: locationContext?.name,
        weather: weatherContext || undefined,
      });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to save memory. Try again.');
        setTimeout(() => setError(null), 3000);
        setLoading(false);
        return;
      }
      
      // Cleanup preview
      URL.revokeObjectURL(previewUrl);
      setPreviewBlob(null);
      setPreviewUrl(null);
      setSelectedFilter('none');
      
      setLoading(false);
      showSuccess();
    } catch (err) {
      console.error('Save exception:', err);
      setError('Something went wrong. Try again.');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
    }
  }, [previewBlob, previewUrl, selectedFilter, userId, journeyId, locationContext, weatherContext]);

  // Cancel photo preview
  const cancelPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewBlob(null);
    setPreviewUrl(null);
    setSelectedFilter('none');
  }, [previewUrl]);

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
      // Compress the image before showing preview
      const compressedBlob = await compressImage(file, IMAGE_COMPRESSION);
      
      const stats = getCompressionStats(file.size, compressedBlob.size);
      console.log(`Image compressed: ${stats.originalKB}KB → ${stats.compressedKB}KB (saved ${stats.percentage}%)`);
      
      // Create preview URL and show filter selection
      const url = URL.createObjectURL(compressedBlob);
      setPreviewBlob(compressedBlob);
      setPreviewUrl(url);
      setSelectedFilter('none');
      setLoading(false);
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
        latitude: locationContext?.latitude,
        longitude: locationContext?.longitude,
        locationName: locationContext?.name,
        weather: weatherContext || undefined,
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

const handleAudioRecordingComplete = async (blob: Blob, duration: number) => {
  setLoading(true);
  setError(null);

  if (!userId) {
    setError('Not authenticated');
    setTimeout(() => setError(null), 3000);
    setLoading(false);
    return;
  }

  try {
    // Upload audio
    const { data: uploadData, error: uploadError } = await uploadMemoryAudio(
      userId, 
      journeyId, 
      blob,
      blob.type || 'audio/webm'
    );

    if (uploadError || !uploadData) {
      console.error('Audio upload error:', uploadError);
      setError('Upload failed. Check your connection.');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
      return;
    }

    // Create memory record with location and weather
    const { error: insertError } = await createMemory({
      journeyId,
      type: 'audio',
      audioUrl: uploadData.publicUrl,
      duration,
      latitude: locationContext?.latitude,
      longitude: locationContext?.longitude,
      locationName: locationContext?.name,
      weather: weatherContext || undefined,
    });

    if (insertError) {
      console.error('Audio insert error:', insertError);
      setError('Failed to save audio. Try again.');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
      return;
    }

    setLoading(false);
    showSuccess();
  } catch (err) {
    console.error('Audio exception:', err);
    setError('Something went wrong. Try again.');
    setTimeout(() => setError(null), 3000);
    setLoading(false);
  }
};

const handleAudioError = (message: string) => {
  setError(message);
  setTimeout(() => setError(null), 4000);
};

  // Photo preview mode with filter selection
  if (previewUrl) {
    return (
      <div className="fixed inset-0 text-white z-50 flex flex-col safe-top safe-bottom overflow-hidden">
        {/* Immersive background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
          <div className="absolute top-20 right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>
        
        {/* Top Bar */}
        <div className="relative z-30 safe-top">
          <div className="flex justify-between items-center p-6">
            <IconButton 
              icon={<X className="w-5 h-5" />}
              label="Cancel"
              onClick={cancelPreview}
              variant="ghost"
              dark
            />
            <div className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-sm font-medium text-white/70">Choose a filter</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Photo Preview */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-4 pb-48">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[60vh] object-contain"
              style={{ filter: PHOTO_FILTERS[selectedFilter].filter }}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-30 safe-bottom">
          <div className="p-6 pt-8 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm">
            {/* Filter Selector */}
            <div className="mb-6">
              <FilterSelector
                imageUrl={previewUrl}
                selectedFilter={selectedFilter}
                onSelectFilter={setSelectedFilter}
              />
            </div>
            
            {/* Save Button */}
            <button
              onClick={savePhotoWithFilter}
              disabled={loading}
              className="w-full py-4 rounded-full bg-white text-gray-900 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-2xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Photo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="absolute top-24 left-6 right-6 z-40">
            <div className="bg-red-500/20 backdrop-blur-sm text-red-300 px-4 py-3 rounded-xl text-center text-sm border border-red-500/30">
              {error}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 text-white z-50 flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Immersive background for non-photo modes */}
      {mode !== 'photo' && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
          <div className="absolute top-20 right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>
      )}
      {mode === 'photo' && <div className="absolute inset-0 bg-black" />}
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 safe-top">
        <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <IconButton 
            icon={<X className="w-5 h-5" />}
            label="Close camera"
            onClick={onClose}
            variant="ghost"
            dark
          />
          
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/80">{journeyName}</span>
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
      <div className="flex-1 relative">
        {mode === 'audio' ? (
          <div className="absolute inset-0 flex items-center justify-center pt-20">
            <AudioRecorder
              onRecordingComplete={handleAudioRecordingComplete}
              onError={handleAudioError}
              disabled={loading}
            />
          </div>
        ) : mode === 'photo' ? (
          <div 
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Live camera preview */}
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive && cameraReady ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ 
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                filter: PHOTO_FILTERS[selectedFilter].filter,
              }}
            />
            
            {/* Canvas for capturing (hidden) */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Loading state while camera initializes */}
            {cameraActive && !cameraReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            )}
            
            
            {/* Camera error state */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                {/* Warm gradient background for error state */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
                  <div className="absolute top-20 right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-40 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/20">
                    <Camera className="w-10 h-10 text-white/60" />
                  </div>
                  <p className="text-white/60 text-sm mb-8 text-center max-w-xs">{cameraError}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startCamera()}
                      className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold text-sm flex items-center gap-2 shadow-2xl active:scale-[0.98] transition-transform"
                    >
                      <Camera className="w-4 h-4" />
                      Try Again
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium text-sm flex items-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Flip camera button - only show if multiple cameras and camera is active */}
            {hasMultipleCameras && cameraActive && cameraReady && (
              <IconButton 
                icon={<SwitchCamera className="w-5 h-5" />}
                label="Switch camera"
                onClick={flipCamera}
                variant="bordered"
                size="lg"
                dark
                className="absolute top-24 right-6 z-20"
              />
            )}
            
            {/* Gallery/upload button */}
            {cameraActive && cameraReady && (
              <IconButton 
                icon={<ImageIcon className="w-5 h-5" />}
                label="Upload from gallery"
                onClick={() => fileInputRef.current?.click()}
                variant="bordered"
                size="lg"
                dark
                className="absolute top-24 left-6 z-20"
              />
            )}
            
            {/* Zoom controls - minimal pill */}
            {cameraActive && cameraReady && supportsZoom && maxZoom > 1 && (
              <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-[10px]">
                  <button
                    onClick={() => applyZoom(zoomLevel - 0.5)}
                    disabled={zoomLevel <= minZoom}
                    className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white disabled:text-white/20 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="font-medium text-white/90 min-w-[1.75rem] text-center">
                    {zoomLevel.toFixed(1)}×
                  </span>
                  <button
                    onClick={() => applyZoom(zoomLevel + 0.5)}
                    disabled={zoomLevel >= maxZoom}
                    className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white disabled:text-white/20 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 pt-24 pb-52 px-6 flex flex-col overflow-y-auto">
            {/* Full-screen writing area */}
            <textarea 
              autoFocus
              placeholder="What do you want to remember?"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (e.target.value) setShowPrompts(false);
              }}
              maxLength={10000}
              className="flex-1 min-h-[200px] w-full bg-transparent text-2xl font-light text-white placeholder:text-white/30 focus:outline-none resize-none leading-relaxed"
            />
            
            {/* Bottom section - prompts or character count */}
            <div className="pt-4 pb-safe shrink-0">
              {note.length > 0 ? (
                <div className="text-xs text-white/30">
                  {note.length.toLocaleString()} characters
                </div>
              ) : prompts.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 mb-3">
                    <Sparkles className="w-3 h-3" />
                    <span>Try a prompt</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prompts.slice(0, 3).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setNote(prompt + '\n\n')}
                        className="px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all text-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Filter Panel - slides up when showFilters is true */}
      {mode === 'photo' && cameraActive && cameraReady && showFilters && (
        <div className="absolute bottom-0 left-0 right-0 z-40 safe-bottom animate-enter">
          {/* Glassmorphism container */}
          <div className="mx-4 mb-4 p-4 pb-6 bg-gradient-to-br from-amber-950/95 via-orange-950/95 to-slate-950/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
            {/* Handle bar */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-1 rounded-full bg-white/30" />
            </div>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Filters</span>
                {selectedFilter !== 'none' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30">
                    {PHOTO_FILTERS[selectedFilter].name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white hover:bg-white/20 transition-all"
              >
                Done
              </button>
            </div>
            
            {/* Filter selector */}
            <FilterSelector
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              livePreview
            />
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 safe-bottom">
        <div className={`p-6 pt-8 ${mode === 'photo' ? 'bg-gradient-to-t from-black via-black/90 to-transparent' : 'bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-sm'}`}>
          
          {/* Mode Switcher */}
          <div className="flex justify-center gap-2 mb-6">
            <button 
              onClick={() => setMode('photo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === 'photo' ? 'bg-white/20 text-white border border-white/20' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Camera className="w-4 h-4" />
              Photo
            </button>
            <button 
              onClick={() => setMode('audio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === 'audio' ? 'bg-white/20 text-white border border-white/20' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Mic className="w-4 h-4" />
              Audio
            </button>
            <button 
              onClick={() => setMode('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === 'text' ? 'bg-white/20 text-white border border-white/20' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              Note
            </button>
          </div>

          {/* Action Row - Filter button, Capture, Placeholder */}
          <div className="flex justify-center items-center gap-8">
            {/* Left side - Filter button (photo mode only) */}
            {mode === 'photo' && cameraActive && cameraReady ? (
              <button
                onClick={() => setShowFilters(true)}
                className={`flex flex-col items-center gap-1 transition-all ${
                  selectedFilter !== 'none' ? 'text-white' : 'text-white/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  selectedFilter !== 'none' 
                    ? 'bg-white/20 border border-white/40' 
                    : 'bg-white/10 border border-white/20'
                }`}>
                  <Palette className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">
                  {selectedFilter !== 'none' ? PHOTO_FILTERS[selectedFilter].name : 'Filters'}
                </span>
              </button>
            ) : (
              <div className="w-12" /> 
            )}

            {/* Center - Main action button */}
            {loading ? (
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
              </div>
            ) : mode === 'audio' ? (
              <div className="h-20" />
            ) : mode === 'photo' ? (
              <>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleCapture} 
                />
                
                {cameraActive && cameraReady ? (
                  <button 
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center active:scale-95 transition-transform group shadow-2xl"
                  >
                    <div className="w-16 h-16 bg-white rounded-full group-active:bg-white/80 transition-colors" />
                  </button>
                ) : cameraError ? (
                  <div className="h-20" />
                ) : (
                  <div className="w-20 h-20 rounded-full border-[3px] border-white/30 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full" />
                  </div>
                )}
              </>
            ) : (
              <button 
                onClick={handleNote}
                disabled={!note.trim()}
                className="h-14 px-8 bg-white text-gray-900 rounded-full font-semibold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-2xl"
              >
                Save Note
                <Send className="w-4 h-4" />
              </button>
            )}

            {/* Right side - Placeholder for symmetry */}
            {mode === 'photo' && cameraActive && cameraReady ? (
              <div className="w-12" />
            ) : (
              <div className="w-12" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
