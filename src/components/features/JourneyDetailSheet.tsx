'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Pencil, Trash2, UserPlus, Users, ChevronRight, Clock, Camera, Unlock } from 'lucide-react';
import { getEmailByUserId, updateJourney } from '@/services';
import { useToast, IconButton, ConfirmDialog } from '@/components/ui';
import { getTimeUntilUnlock, getJourneyGradient, hapticSuccess } from '@/lib';
import type { Journey } from '@/types';

interface JourneyDetailSheetProps {
  journey: Journey | null;
  onClose: () => void;
  onCapture: (journey: Journey) => void;
  onEdit: (journey: Journey) => void;
  onDelete: (journeyId: string) => void;
  onManageMemories: (journey: Journey) => void;
  onInvite: (journey: Journey) => void;
  isOwner: boolean;
  onJourneyUpdated?: (journey: Journey) => void;
}

export default function JourneyDetailSheet({
  journey,
  onClose,
  onCapture,
  onEdit,
  onDelete,
  onManageMemories,
  onInvite,
  isOwner,
  onJourneyUpdated,
}: JourneyDetailSheetProps) {
  const { showToast } = useToast();
  
  // Collaborator emails cache
  const [collaboratorEmails, setCollaboratorEmails] = useState<Record<string, string>>({});
  
  // Unlock now state
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Fetch collaborator emails when journey changes
  useEffect(() => {
    if (!journey?.shared_with?.length) return;
    
    const fetchEmails = async () => {
      const unknownIds = journey.shared_with!.filter(id => !collaboratorEmails[id]);
      if (unknownIds.length === 0) return;
      
      for (const id of unknownIds) {
        const { data } = await getEmailByUserId(id);
        if (data) {
          setCollaboratorEmails(prev => ({ ...prev, [id]: data }));
        }
      }
    };
    
    fetchEmails();
  }, [journey?.shared_with, collaboratorEmails]);

  // Remove a collaborator
  const handleRemoveCollaborator = async (userIdToRemove: string) => {
    if (!journey) return;
    
    const updatedSharedWith = (journey.shared_with || []).filter(id => id !== userIdToRemove);
    
    const { error } = await updateJourney({
      id: journey.id,
      sharedWith: updatedSharedWith.length > 0 ? updatedSharedWith : [],
    });
    
    if (error) {
      showToast('Failed to remove collaborator', 'error');
      return;
    }
    
    hapticSuccess();
    showToast('Collaborator removed', 'success');
    
    onJourneyUpdated?.({
      ...journey,
      shared_with: updatedSharedWith.length > 0 ? updatedSharedWith : undefined,
    });
  };

  // Unlock journey immediately
  const handleUnlockNow = async () => {
    if (!journey || unlocking) return;
    
    setUnlocking(true);
    
    const { error } = await updateJourney({
      id: journey.id,
      unlockDate: new Date().toISOString(),
    });
    
    if (error) {
      showToast('Failed to unlock journey', 'error');
      setUnlocking(false);
      return;
    }
    
    hapticSuccess();
    showToast('Journey unlocked! 🎉', 'success');
    setShowUnlockConfirm(false);
    
    // Reload to show the unlocked gallery
    window.location.reload();
  };

  if (!journey) return null;

  const countdown = getTimeUntilUnlock(journey.unlock_date);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col safe-top safe-bottom">
      {/* Unlock Now Confirmation */}
      <ConfirmDialog
        isOpen={showUnlockConfirm}
        onClose={() => setShowUnlockConfirm(false)}
        onConfirm={handleUnlockNow}
        title="Unlock journey now?"
        description="This will unlock your memories immediately. You can view them right away, but you won't be able to add more memories to this journey."
        confirmLabel={unlocking ? 'Unlocking...' : 'Unlock Now'}
        variant="confirm"
        loading={unlocking}
      />
      
      {/* Dynamic gradient background */}
      <div 
        className="absolute inset-0"
        style={{ background: getJourneyGradient(journey.name).gradient }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 40%),
                            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 40%)`
        }}
      />
      
      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <IconButton 
          icon={<X className="w-5 h-5" />}
          label="Close"
          onClick={onClose}
          variant="bordered"
          dark
        />
        
        {/* Owner-only actions */}
        {isOwner && (
          <div className="flex gap-2">
            <IconButton icon={<UserPlus className="w-4 h-4" />} label="Share journey" onClick={() => onInvite(journey)} variant="bordered" dark />
            <IconButton 
              icon={<Pencil className="w-4 h-4" />} 
              label="Edit journey" 
              onClick={() => { onClose(); onEdit(journey); }} 
              variant="bordered"
              dark 
            />
            <IconButton 
              icon={<Trash2 className="w-4 h-4" />} 
              label="Delete journey" 
              onClick={() => { onClose(); onDelete(journey.id); }} 
              variant="bordered"
              dark 
            />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-12">
        {/* Locked indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">Locked</span>
        </div>
        
        {/* Journey Name */}
        <h1 className="text-4xl font-bold mb-2 text-white">{journey.name}</h1>
        
        {/* Memory count with manage link */}
        <button 
          onClick={() => onManageMemories(journey)}
          className="text-white/70 mb-4 flex items-center gap-2 hover:text-white transition-colors"
        >
          <span>{journey.memory_count || 0} {(journey.memory_count || 0) === 1 ? 'memory' : 'memories'} captured</span>
          {(journey.memory_count || 0) > 0 && (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {/* Shared with indicator */}
        {(journey.shared_with?.length || 0) > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                Shared with {journey.shared_with?.length} {journey.shared_with?.length === 1 ? 'person' : 'people'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {journey.shared_with?.map(userId => (
                <div 
                  key={userId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/10"
                >
                  <span className="text-sm text-white/80">
                    {collaboratorEmails[userId] || 'Loading...'}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveCollaborator(userId)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-colors"
                      title="Remove collaborator"
                    >
                      <X className="w-3 h-3 text-white/50 hover:text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!journey.shared_with?.length && <div className="mb-4" />}
        
        {/* Countdown */}
        <div className="rounded-2xl p-6 mb-4 bg-white/5 backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-white/60" />
            <p className="text-xs text-white/60 uppercase tracking-wider">Unlocks in</p>
          </div>
          <p className="text-4xl font-light tracking-wide text-white">{countdown}</p>
        </div>
        
        {/* Unlock Now button (owner only) */}
        {isOwner && (
          <button
            onClick={() => setShowUnlockConfirm(true)}
            className="flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-4"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock now</span>
          </button>
        )}
        
        {/* Capture Button */}
        <button
          onClick={() => {
            onClose();
            onCapture(journey);
          }}
          className="w-full h-16 rounded-full bg-gradient-to-r from-white to-zinc-100 text-black font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-xl shadow-white/10"
        >
          <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          Capture Memory
        </button>
      </div>
    </div>
  );
}

