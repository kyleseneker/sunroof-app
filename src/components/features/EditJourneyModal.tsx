'use client';

import { useState, useEffect } from 'react';
import { X, Pencil, MapPin, Timer } from 'lucide-react';
import { useToast, Button, IconButton } from '@/components/ui';
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
    
    // Only process unlock date if journey is still locked (unlock_date in future)
    const isLocked = new Date(journey.unlock_date) > new Date();
    let unlockDateStr: string | undefined;
    
    if (isLocked && editDate) {
      const newDate = new Date(editDate);
      newDate.setHours(23, 59, 59, 999);
      
      if (newDate <= new Date()) {
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
    <div className="fixed inset-0 z-[60] flex flex-col safe-top safe-bottom overflow-y-auto">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
      
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 flex items-center p-6">
        <IconButton 
          icon={<X className="w-5 h-5" />}
          label="Close"
          onClick={handleClose}
          variant="ghost"
          dark
        />
      </header>

      <div className="flex-1 flex flex-col px-6 pb-6 animate-enter relative z-10">
        
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <Pencil className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-3xl font-light tracking-tight text-white">Edit Journey</h2>
          </div>
          <p className="text-white/50 text-sm mb-10 ml-[60px]">Update your journey details</p>
          
          <div className="space-y-8">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 font-medium mb-3">
                <MapPin className="w-3 h-3" />
                Name
              </label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                className="w-full bg-white/5 backdrop-blur-md border border-white/20 focus:border-amber-400/50 rounded-2xl px-5 py-4 text-2xl font-light text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 transition-all"
              />
            </div>
            
            {/* Emoji Picker */}
            <EmojiPicker value={editEmoji} onChange={setEditEmoji} />
            
            {/* Unlock Date - only show for locked journeys (unlock date in future) */}
            {new Date(journey.unlock_date) > new Date() && (
              <div>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 font-medium mb-3">
                  <Timer className="w-3 h-3" />
                  Unlock Date
                </label>
                <input 
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white/5 backdrop-blur-md border border-white/20 focus:border-amber-400/50 rounded-2xl px-5 py-4 text-lg text-white focus:outline-none focus:bg-white/10 transition-all appearance-none [color-scheme:dark]"
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
              className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

