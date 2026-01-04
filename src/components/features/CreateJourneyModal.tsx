'use client';

import { useState, useMemo } from 'react';
import { X, MapPin, Timer, UserPlus, Plane } from 'lucide-react';
import { useToast, Button } from '@/components/ui';
import { EmojiPicker } from '@/components/features';
import { createJourney, getUserIdByEmail } from '@/services';
import { hapticSuccess, DESTINATION_SUGGESTIONS, ErrorMessages, MAX_JOURNEY_NAME_LENGTH } from '@/lib';

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
  
  const [tripName, setTripName] = useState('');
  const [unlockDays, setUnlockDays] = useState<number | null>(3);
  const [customDate, setCustomDate] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Share during creation state
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [shareEmailInput, setShareEmailInput] = useState('');

  // Random destination placeholder
  const destinationPlaceholder = useMemo(() => {
    return DESTINATION_SUGGESTIONS[Math.floor(Math.random() * DESTINATION_SUGGESTIONS.length)];
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setTripName('');
    setUnlockDays(3);
    setCustomDate('');
    setEmoji(null);
    setShareEmails([]);
    setShareEmailInput('');
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      unlockDate.setTime(unlockDate.getTime() + (unlockDays || 3) * 24 * 60 * 60 * 1000);
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

      // Fetch cover image from Unsplash (non-blocking, graceful fallback)
      let coverImageUrl: string | undefined;
      let coverImageAttribution: string | undefined;
      try {
        const coverResponse = await fetch('/api/cover-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: cleanName }),
        });
        if (coverResponse.ok) {
          const { photo } = await coverResponse.json();
          if (photo) {
            coverImageUrl = photo.url;
            coverImageAttribution = photo.attribution;
          }
        }
      } catch {
        // Cover image is optional, continue without it
      }

      const { error } = await createJourney({
        userId,
        name: cleanName,
        unlockDate: unlockDate.toISOString(),
        sharedWith: sharedWithIds.length > 0 ? sharedWithIds : undefined,
        emoji: emoji || undefined,
        coverImageUrl,
        coverImageAttribution,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] flex flex-col safe-top safe-bottom">
      <div className="flex-1 flex flex-col p-6 animate-enter">
        <button 
          onClick={handleClose}
          className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-hover)] mb-8"
        >
          <X className="w-5 h-5 text-[var(--fg-muted)]" />
        </button>
        
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
              <Plane className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-3xl font-light tracking-tight text-[var(--fg-base)]">New Journey</h2>
          </div>
          <p className="text-[var(--fg-muted)] text-sm mb-10 ml-[60px]">Where are you headed?</p>
          
          <form onSubmit={handleCreate} className="space-y-8">
            {/* Destination */}
            <div>
              <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3">
                <MapPin className="w-3 h-3" />
                Destination
              </label>
              <input 
                type="text" 
                autoFocus
                placeholder={destinationPlaceholder}
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                maxLength={50}
                className="w-full bg-[var(--bg-surface)]/50 border border-[var(--border-base)] focus:border-orange-400 rounded-2xl px-5 py-4 text-2xl font-light text-[var(--fg-base)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:bg-[var(--bg-base)]/50 transition-all input-premium"
              />
            </div>

            {/* Emoji Picker */}
            <EmojiPicker value={emoji} onChange={setEmoji} />

            {/* Unlock After */}
            <div>
              <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3">
                <Timer className="w-3 h-3" />
                Unlock After
              </label>
              <div className="flex gap-2 mb-3">
                {[3, 5, 7, 14].map((days) => {
                  const isSelected = unlockDays === days && !customDate;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setUnlockDays(days);
                        setCustomDate('');
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--fg-base)] text-[var(--fg-inverse)]' 
                          : 'bg-[var(--bg-surface)] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      {days}d
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--fg-subtle)]">or</span>
                <input
                  type="date"
                  value={customDate}
                  onFocus={() => setUnlockDays(null)}
                  onInput={() => setUnlockDays(null)}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate >= today) {
                      setCustomDate(e.target.value);
                      setUnlockDays(null);
                    } else {
                      setCustomDate('');
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all bg-[var(--bg-surface)] border-2 ${
                    customDate 
                      ? 'border-[var(--fg-base)] text-[var(--fg-base)]' 
                      : 'border-transparent text-[var(--fg-muted)]'
                  }`}
                />
              </div>
            </div>

            {/* Share With (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3">
                <UserPlus className="w-3 h-3" />
                Share With <span className="text-[var(--fg-subtle)] normal-case tracking-normal">(optional)</span>
              </label>
              
              {shareEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {shareEmails.map((email, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-xs"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => setShareEmails(shareEmails.filter((_, idx) => idx !== i))}
                        className="hover:text-blue-300 transition-colors"
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
                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl py-3 px-4 text-sm text-[var(--fg-base)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:border-[var(--fg-subtle)] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddShareEmail}
                  disabled={!shareEmailInput.trim() || !shareEmailInput.includes('@')}
                  className="px-4 py-3 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-[var(--fg-subtle)] mt-2">
                They'll be invited when the journey is created
              </p>
            </div>
            
            <Button 
              type="submit"
              disabled={!tripName}
              loading={loading}
              fullWidth 
              size="lg" 
              className="mt-4"
            >
              {loading ? 'Creating...' : 'Start Journey'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

