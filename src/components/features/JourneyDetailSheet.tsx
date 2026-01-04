'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Pencil, Trash2, UserPlus, Users, Clock, Camera, Unlock, Mic, FileText } from 'lucide-react';
import { getEmailByUserId, updateJourney, fetchMemoriesForJourney } from '@/services';
import { useToast, IconButton, ConfirmDialog } from '@/components/ui';
import { MemoryPreviewCard, MemoryStatBadge, CountdownTimer } from '@/components/features';
import { getJourneyGradient, hapticSuccess, formatRelativeDate, ErrorMessages, SuccessMessages } from '@/lib';
import type { Journey, Memory } from '@/types';
import type { CaptureMode } from './CameraView';

interface JourneyDetailSheetProps {
  journey: Journey | null;
  onClose: () => void;
  onCapture: (journey: Journey, mode?: CaptureMode) => void;
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
  
  // Memory preview state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);

  // Fetch memories for preview wall
  useEffect(() => {
    if (!journey?.id) return;
    
    const loadMemories = async () => {
      setMemoriesLoading(true);
      const { data } = await fetchMemoriesForJourney(journey.id);
      if (data) {
        setMemories(data);
      }
      setMemoriesLoading(false);
    };
    
    loadMemories();
  }, [journey?.id]);

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
      showToast(ErrorMessages.DELETE_FAILED('collaborator'), 'error');
      return;
    }
    
    hapticSuccess();
    showToast(SuccessMessages.DELETED('Collaborator'), 'success');
    
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
      showToast(ErrorMessages.UPDATE_FAILED('journey'), 'error');
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
  
  // Memory stats
  const photoCount = memories.filter(m => m.type === 'photo').length;
  const noteCount = memories.filter(m => m.type === 'text').length;
  const audioCount = memories.filter(m => m.type === 'audio').length;
  
  // Get most recent memory timestamp
  const lastMemoryDate = memories.length > 0 
    ? memories.reduce((latest, m) => 
        new Date(m.created_at) > new Date(latest.created_at) ? m : latest
      ).created_at
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col safe-top safe-bottom overflow-hidden">
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
      
      {/* Cover image or gradient background */}
      {journey.cover_image_url ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${journey.cover_image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        </>
      ) : (
        <>
          <div 
            className="absolute inset-0"
            style={{ background: getJourneyGradient(journey.name).gradient }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-15 pattern-overlay" />
        </>
      )}
      
      
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
              onClick={() => onEdit(journey)} 
              variant="bordered"
              dark 
            />
            <IconButton 
              icon={<Trash2 className="w-4 h-4" />} 
              label="Delete journey" 
              onClick={() => onDelete(journey.id)} 
              variant="bordered"
              dark
            />
          </div>
        )}
      </div>
      
      {/* Blurred Memory Preview Card or Loading Skeleton */}
      {memoriesLoading && (journey.memory_count ?? 0) > 0 ? (
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 pt-2">
          <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-white/5 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      ) : memories.length > 0 ? (
        <MemoryPreviewCard 
          memories={memories} 
          onTap={() => onManageMemories(journey)} 
        />
      ) : null}

      {/* Content */}
      <div className={`relative z-10 p-6 pb-16 safe-bottom ${(journey.memory_count ?? 0) === 0 ? 'flex-1 flex flex-col justify-end' : 'mt-auto'}`}>
        {/* Locked indicator - only show when no memories */}
        {!memoriesLoading && (journey.memory_count ?? 0) === 0 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center relative lock-pulse">
              <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping-slow" />
              <Lock className="w-5 h-5 text-amber-400 relative z-10" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-400 block">Locked</span>
              <span className="text-[10px] text-amber-400/50">Capture memories to seal them</span>
            </div>
          </div>
        )}
        
        {/* Journey Name */}
        <h1 className="text-4xl font-bold mb-3 text-white">
          {journey.emoji && <span className="mr-3">{journey.emoji}</span>}
          {journey.name}
        </h1>
        
        {/* Memory Stats Row - reserve consistent height */}
        <div className="h-5 mb-4 text-sm">
          {memoriesLoading ? (
            <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
          ) : memories.length === 0 ? (
            <p className="text-white/50">No memories captured yet</p>
          ) : (
            <div className="flex items-center gap-2">
              <MemoryStatBadge type="photo" count={photoCount} />
              <MemoryStatBadge type="note" count={noteCount} />
              <MemoryStatBadge type="audio" count={audioCount} />
              {lastMemoryDate && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-white/40">Last {formatRelativeDate(lastMemoryDate)}</span>
                </>
              )}
            </div>
          )}
        </div>
        
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
        <div className="rounded-2xl p-4 mb-4 bg-white/5 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Unlocks in</p>
          </div>
          <CountdownTimer unlockDate={journey.unlock_date} />
        </div>
        
        {/* Unlock Now button (owner only) */}
        {isOwner && (
          <button
            onClick={() => setShowUnlockConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-4"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock now</span>
          </button>
        )}
        
        {/* Quick Capture Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              onCapture(journey, 'photo');
            }}
            className="flex-1 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] active:bg-white/20 transition-all"
          >
            <Camera className="w-5 h-5" />
            <span>Photo</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onCapture(journey, 'audio');
            }}
            className="flex-1 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] active:bg-white/20 transition-all"
          >
            <Mic className="w-5 h-5" />
            <span>Voice</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onCapture(journey, 'text');
            }}
            className="flex-1 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] active:bg-white/20 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span>Note</span>
          </button>
        </div>
      </div>
    </div>
  );
}

