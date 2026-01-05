'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { X, MapPin, Timer, UserPlus, ChevronRight, ChevronLeft, Sparkles, Check, Calendar } from 'lucide-react';
import { useToast, IconButton } from '@/components/ui';
import { EmojiPicker } from '@/components/features';
import { createJourney, getUserIdByEmail } from '@/services';
import { hapticSuccess, hapticClick, DESTINATION_SUGGESTIONS, ErrorMessages, MAX_JOURNEY_NAME_LENGTH } from '@/lib';
import Image from 'next/image';

interface CreateJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export default function CreateJourneyModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: CreateJourneyModalProps) {
  const { showToast } = useToast();
  
  // Multi-step state
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  // Form state
  const [tripName, setTripName] = useState('');
  const [unlockDays, setUnlockDays] = useState<number | null>(5);
  const [customDate, setCustomDate] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Preview image state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewAttribution, setPreviewAttribution] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Share during creation state
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [shareEmailInput, setShareEmailInput] = useState('');

  // Random destination placeholder
  const destinationPlaceholder = useMemo(() => {
    return DESTINATION_SUGGESTIONS[Math.floor(Math.random() * DESTINATION_SUGGESTIONS.length)];
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch preview image when destination changes (debounced)
  const fetchPreviewImage = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setPreviewImage(null);
      setPreviewAttribution(null);
      return;
    }
    
    setLoadingPreview(true);
    try {
      const response = await fetch('/api/cover-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (response.ok) {
        const { photo } = await response.json();
        if (photo) {
          setPreviewImage(photo.url);
          setPreviewAttribution(photo.attribution);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    if (tripName.trim().length >= 2) {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchPreviewImage(tripName);
      }, 800);
    } else {
      setPreviewImage(null);
      setPreviewAttribution(null);
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [tripName, fetchPreviewImage]);

  const handleClose = () => {
    setStep(1);
    setTripName('');
    setUnlockDays(5);
    setCustomDate('');
    setEmoji(null);
    setShareEmails([]);
    setShareEmailInput('');
    setPreviewImage(null);
    setPreviewAttribution(null);
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && !tripName.trim()) {
      showToast(ErrorMessages.REQUIRED_FIELD('a destination'), 'error');
      return;
    }
    if (step < totalSteps) {
      hapticClick();
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      hapticClick();
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    const cleanName = tripName.trim();
    if (!cleanName) {
      showToast(ErrorMessages.REQUIRED_FIELD('a destination'), 'error');
      return;
    }
    if (cleanName.length > MAX_JOURNEY_NAME_LENGTH) {
      showToast(ErrorMessages.TOO_LONG('Destination name', MAX_JOURNEY_NAME_LENGTH), 'error');
      return;
    }
    if (!unlockDays && !customDate) {
      showToast(ErrorMessages.INVALID_DATE, 'error');
      return;
    }
    
    setLoading(true);

    let unlockDate: Date;
    if (customDate) {
      unlockDate = new Date(customDate);
      unlockDate.setHours(23, 59, 59, 999);
    } else {
      unlockDate = new Date();
      unlockDate.setTime(unlockDate.getTime() + (unlockDays || 5) * 24 * 60 * 60 * 1000);
    }

    if (unlockDate <= new Date()) {
      showToast(ErrorMessages.DATE_MUST_BE_FUTURE, 'error');
      setLoading(false);
      return;
    }

    try {
      // Resolve share emails to user IDs
      const sharedWithIds: string[] = [];
      if (shareEmails.length > 0) {
        for (const email of shareEmails) {
          const { data } = await getUserIdByEmail(email);
          if (data) {
            sharedWithIds.push(data);
          }
        }
      }

      const { error } = await createJourney({
        userId,
        name: cleanName,
        unlockDate: unlockDate.toISOString(),
        sharedWith: sharedWithIds.length > 0 ? sharedWithIds : undefined,
        emoji: emoji || undefined,
        coverImageUrl: previewImage || undefined,
        coverImageAttribution: previewAttribution || undefined,
      });

      if (error) {
        console.error('Create journey error:', error);
        showToast(ErrorMessages.CREATE_FAILED('journey'), 'error');
        setLoading(false);
      } else {
        const shareMsg = sharedWithIds.length > 0 
          ? ` Shared with ${sharedWithIds.length} ${sharedWithIds.length === 1 ? 'person' : 'people'}.`
          : '';
        const skippedCount = shareEmails.length - sharedWithIds.length;
        const skipMsg = skippedCount > 0 
          ? ` (${skippedCount} email${skippedCount > 1 ? 's' : ''} not found)`
          : '';
        hapticSuccess();
        showToast(`${cleanName} created!${shareMsg}${skipMsg}`, 'success');
        
        handleClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Create journey exception:', err);
      showToast(ErrorMessages.GENERIC, 'error');
      setLoading(false);
    }
  };

  const handleAddShareEmail = () => {
    const email = shareEmailInput.trim().toLowerCase();
    if (email && email.includes('@') && !shareEmails.includes(email)) {
      setShareEmails([...shareEmails, email]);
      setShareEmailInput('');
    }
  };

  // Calculate unlock date for preview
  const getUnlockDatePreview = () => {
    if (customDate) {
      return new Date(customDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    if (unlockDays) {
      const date = new Date();
      date.setDate(date.getDate() + unlockDays);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden safe-top safe-bottom">
      {/* Dynamic background */}
      <div className="absolute inset-0 transition-all duration-700">
        {previewImage ? (
          <>
            <Image
              src={previewImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
        )}
        
        {/* Loading shimmer for preview */}
        {loadingPreview && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        )}
      </div>

      {/* Header */}
      <header className="relative z-20 flex justify-between items-center p-6">
        <IconButton 
          icon={step > 1 ? <ChevronLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          label={step > 1 ? "Go back" : "Close"}
          onClick={step > 1 ? handleBack : handleClose}
          variant="ghost"
          dark
        />
        
        {/* Step indicators */}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i + 1 === step 
                  ? 'w-6 bg-white' 
                  : i + 1 < step 
                    ? 'w-2 bg-white/60' 
                    : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Content - scrollable and centered for keyboard */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 pb-safe flex flex-col justify-center">
        {/* STEP 1: Destination */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-light text-white mb-2">Where to?</h1>
              <p className="text-white/60">Enter your destination to begin</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <input 
                type="text" 
                autoFocus
                placeholder={destinationPlaceholder}
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                maxLength={50}
                className="w-full bg-transparent text-3xl font-light text-white placeholder:text-white/30 focus:outline-none text-center"
              />
              
              {previewImage && previewAttribution && (
                <p className="text-center text-white/40 text-xs mt-4">
                  Photo by {previewAttribution}
                </p>
              )}
            </div>
            
            <button
              onClick={handleNext}
              disabled={!tripName.trim()}
              className="mt-6 w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: Timing */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Timer className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-light text-white mb-2">When to unlock?</h1>
              <p className="text-white/60">Your memories will stay sealed until then</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-6">
              {/* Quick options */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 3, 5, 7, 14].map((days) => {
                  const isSelected = unlockDays === days && !customDate;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        hapticClick();
                        setUnlockDays(days);
                        setCustomDate('');
                      }}
                      className={`py-4 rounded-xl font-medium transition-all ${
                        isSelected
                          ? 'bg-white text-black' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <span className="text-lg">{days}</span>
                      <span className="text-xs opacity-60 ml-0.5">{days === 1 ? 'day' : 'days'}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Custom date */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-sm text-white/40">or pick a date</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>
              
              <div className={`relative flex items-center rounded-xl transition-all ${
                customDate 
                  ? 'bg-white' 
                  : 'bg-white/10'
              }`}>
                <Calendar className={`absolute left-4 w-5 h-5 pointer-events-none ${
                  customDate ? 'text-black/50' : 'text-white/40'
                }`} />
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate >= today) {
                      setCustomDate(e.target.value);
                      setUnlockDays(null);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full py-4 pl-12 pr-4 bg-transparent rounded-xl font-medium appearance-none ${
                    customDate 
                      ? 'text-black' 
                      : 'text-white/60'
                  }`}
                  style={{ colorScheme: customDate ? 'light' : 'dark' }}
                />
              </div>
              
              {/* Preview */}
              {(unlockDays || customDate) && (
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-white/50 text-sm mb-1">Unlocks on</p>
                  <p className="text-white font-medium">{getUnlockDatePreview()}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleNext}
              disabled={!unlockDays && !customDate}
              className="mt-6 w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 3: Personalize */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-light text-white mb-2">Final touches</h1>
              <p className="text-white/60">Add an emoji and invite friends</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-6">
              {/* Emoji picker */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Journey emoji</label>
                <EmojiPicker value={emoji} onChange={setEmoji} />
              </div>
              
              {/* Share section */}
              <div>
                <label className="flex items-center gap-2 text-sm text-white/60 mb-3">
                  <UserPlus className="w-4 h-4" />
                  Invite collaborators
                  <span className="text-white/40">(optional)</span>
                </label>
                
                {shareEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {shareEmails.map((email, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => setShareEmails(shareEmails.filter((_, idx) => idx !== i))}
                          className="hover:text-white/60 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input 
                    type="email"
                    placeholder="friend@email.com"
                    value={shareEmailInput}
                    onChange={(e) => setShareEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddShareEmail();
                      }
                    }}
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddShareEmail}
                    disabled={!shareEmailInput.trim() || !shareEmailInput.includes('@')}
                    className="px-4 py-3 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Summary */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/50">Destination</span>
                  <span className="text-white font-medium">
                    {emoji && <span className="mr-1">{emoji}</span>}
                    {tripName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Unlocks</span>
                  <span className="text-white font-medium">{getUnlockDatePreview()}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleCreate}
              disabled={loading}
              className="mt-6 w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Start Journey
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

