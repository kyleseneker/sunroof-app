'use client';

import { useState, useEffect } from 'react';
import { X, Pencil, MapPin, Timer } from 'lucide-react';
import { useToast, Button } from '@/components/ui';
import { EmojiPicker } from '@/components/features';
import { updateJourney } from '@/services';
import { hapticSuccess } from '@/lib';
import type { Journey } from '@/types';

interface EditJourneyModalProps {
  journey: Journey | null;
  onClose: () => void;
  onSuccess?: (updatedJourney: Journey) => void;
}

export default function EditJourneyModal({
  journey,
  onClose,
  onSuccess,
}: EditJourneyModalProps) {
  const { showToast } = useToast();
  
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editEmoji, setEditEmoji] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when journey changes
  useEffect(() => {
    if (journey) {
      setEditName(journey.name);
      setEditDate(journey.unlock_date.split('T')[0]);
      setEditEmoji(journey.emoji || null);
    }
  }, [journey]);

  const handleClose = () => {
    setEditName('');
    setEditDate('');
    onClose();
  };

  const handleSave = async () => {
    if (!journey || !editName.trim() || isSaving) return;
    
    const cleanName = editName.trim();
    if (cleanName.length > 50) {
      showToast('Name is too long (max 50 characters)', 'error');
      return;
    }
    
    setIsSaving(true);
    
    let unlockDateStr: string | undefined;
    if (editDate) {
      const newDate = new Date(editDate);
      newDate.setHours(23, 59, 59, 999);
      
      // Only validate future date for active journeys
      if (journey.status === 'active' && newDate <= new Date()) {
        showToast('Unlock date must be in the future', 'error');
        setIsSaving(false);
        return;
      }
      
      unlockDateStr = newDate.toISOString();
    }
    
    try {
      const { data: updatedJourney, error } = await updateJourney({
        id: journey.id,
        name: cleanName,
        unlockDate: unlockDateStr,
        emoji: editEmoji,
      });
      
      if (error || !updatedJourney) {
        console.error('Edit journey error:', error);
        showToast('Failed to update journey', 'error');
        setIsSaving(false);
        return;
      }
      
      hapticSuccess();
      showToast('Journey updated!', 'success');
      handleClose();
      onSuccess?.(updatedJourney);
    } catch (err) {
      console.error('Edit journey exception:', err);
      showToast('Something went wrong', 'error');
      setIsSaving(false);
    }
  };

  if (!journey) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-base)] flex flex-col safe-top safe-bottom overflow-y-auto">
      <div className="flex-1 flex flex-col p-6 animate-enter">
        <button 
          onClick={handleClose}
          className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-hover)] mb-8 flex-shrink-0"
        >
          <X className="w-5 h-5 text-[var(--fg-muted)]" />
        </button>
        
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Pencil className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-3xl font-light tracking-tight text-[var(--fg-base)]">Edit Journey</h2>
          </div>
          <p className="text-[var(--fg-muted)] text-sm mb-10 ml-[60px]">Update your journey details</p>
          
          <div className="space-y-8">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3">
                <MapPin className="w-3 h-3" />
                Name
              </label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                className="w-full bg-[var(--bg-surface)]/50 border border-[var(--border-base)] focus:border-blue-400 rounded-2xl px-5 py-4 text-2xl font-light text-[var(--fg-base)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:bg-[var(--bg-base)]/50 transition-all input-premium"
              />
            </div>
            
            {/* Emoji Picker */}
            <EmojiPicker value={editEmoji} onChange={setEditEmoji} />
            
            {/* Unlock Date - only show for locked journeys (unlock date in future) */}
            {new Date(journey.unlock_date) > new Date() && (
              <div>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3">
                  <Timer className="w-3 h-3" />
                  Unlock Date
                </label>
                <input 
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[var(--bg-surface)]/50 border border-[var(--border-base)] focus:border-blue-400 rounded-2xl px-5 py-4 text-lg text-[var(--fg-base)] focus:outline-none focus:bg-[var(--bg-base)]/50 transition-all appearance-none"
                  style={{ minWidth: 0 }}
                />
              </div>
            )}
            
            <Button 
              onClick={handleSave}
              disabled={!editName.trim()}
              loading={isSaving}
              fullWidth 
              size="lg" 
              className="mt-4"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

