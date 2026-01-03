'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast, Button } from '@/components/ui';
import { EmojiPicker } from '@/components/features';
import { updateJourney } from '@/services';
import { hapticSuccess } from '@/lib';
import type { Journey } from '@/types';

interface EditJourneyModalProps {
  journey: Journey | null;
  onClose: () => void;
  onSuccess?: () => void;
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
      const { error } = await updateJourney({
        id: journey.id,
        name: cleanName,
        unlockDate: unlockDateStr,
        emoji: editEmoji,
      });
      
      if (error) {
        console.error('Edit journey error:', error);
        showToast('Failed to update journey', 'error');
        setIsSaving(false);
        return;
      }
      
      hapticSuccess();
      showToast('Journey updated!', 'success');
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Edit journey exception:', err);
      showToast('Something went wrong', 'error');
      setIsSaving(false);
    }
  };

  if (!journey) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)]/90 backdrop-blur-md flex flex-col safe-top safe-bottom">
      <div className="flex-1 flex flex-col p-6 animate-enter">
        <button 
          onClick={handleClose}
          className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-hover)] mb-6"
        >
          <X className="w-5 h-5 text-[var(--fg-muted)]" />
        </button>
        
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <h2 className="text-3xl font-light tracking-tight text-[var(--fg-base)] mb-8">Edit Journey</h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3 block">
                Name
              </label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                className="w-full bg-[var(--bg-surface)] rounded-xl py-3 px-4 text-lg text-[var(--fg-base)] focus:outline-none focus:ring-2 focus:ring-[var(--fg-base)]/20"
              />
            </div>
            
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-3 block">
                Unlock Date
              </label>
              <input 
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-[var(--bg-surface)] rounded-xl py-3 px-4 text-lg text-[var(--fg-base)] focus:outline-none focus:ring-2 focus:ring-[var(--fg-base)]/20"
              />
            </div>

            {/* Emoji Picker */}
            <EmojiPicker value={editEmoji} onChange={setEditEmoji} />
            
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

