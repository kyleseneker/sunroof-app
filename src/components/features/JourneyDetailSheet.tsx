'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Pencil, Trash2, UserPlus, Users, Clock, Camera, Unlock, ImageIcon, FileText, Mic } from 'lucide-react';
import { getEmailByUserId, updateJourney, fetchMemoriesForJourney } from '@/services';
import { useToast, IconButton, ConfirmDialog } from '@/components/ui';
import { getTimeUntilUnlock, getJourneyGradient, hapticSuccess } from '@/lib';
import type { Journey, Memory } from '@/types';

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
  
  // Memory stats
  const photoCount = memories.filter(m => m.type === 'photo').length;
  const noteCount = memories.filter(m => m.type === 'text').length;
  const audioCount = memories.filter(m => m.type === 'audio').length;

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
      
      {/* Blurred Memory Preview Card */}
      {memories.length > 0 && (
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 pt-2">
          <button 
            onClick={() => onManageMemories(journey)}
            className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 group active:scale-[0.98] transition-transform"
          >
            {/* Blurred memory grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5">
              {memories.slice(0, 6).map((memory, index) => (
                <div 
                  key={memory.id}
                  className="relative overflow-hidden animate-fade-in"
                  style={{ 
                    animationDelay: `${index * 80}ms`,
                    opacity: 0
                  }}
                >
                  {memory.type === 'photo' && memory.url ? (
                    <img 
                      src={memory.url} 
                      alt=""
                      className="w-full h-full object-cover blur-[20px] scale-125"
                    />
                  ) : memory.type === 'audio' ? (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500/40 to-pink-500/40" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/40 to-purple-500/40" />
                  )}
                </div>
              ))}
              {/* Fill empty slots if less than 6 memories */}
              {memories.length < 6 && [...Array(6 - Math.min(memories.length, 6))].map((_, i) => (
                <div key={`empty-${i}`} className="bg-white/5" />
              ))}
            </div>
            
            {/* Frosted overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            
            {/* Lock icon in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 lock-pulse">
                <Lock className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-white/80 font-medium text-sm">
                {memories.length} {memories.length === 1 ? 'memory' : 'memories'} sealed
              </p>
              <p className="text-white/40 text-xs mt-1 group-hover:text-white/60 transition-colors">
                Tap to preview
              </p>
            </div>
            
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[
                { left: 25, top: 30 },
                { left: 70, top: 25 },
                { left: 45, top: 55 },
                { left: 30, top: 70 },
                { left: 65, top: 60 },
              ].map((pos, i) => (
                <div
                  key={i}
                  className="vault-particle"
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    animationDelay: `${i * 1.2}s`,
                  }}
                />
              ))}
            </div>
          </button>
        </div>
      )}

      {/* Content */}
      <div className={`relative z-10 p-6 pb-12 ${memories.length === 0 ? 'flex-1 flex flex-col justify-end' : ''}`}>
        {/* Locked indicator with pulse */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center relative lock-pulse">
            <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping" style={{ animationDuration: '2s' }} />
            <Lock className="w-5 h-5 text-amber-400 relative z-10" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-400 block">Locked</span>
            <span className="text-[10px] text-amber-400/50">Memories are sealed</span>
          </div>
        </div>
        
        {/* Journey Name */}
        <h1 className="text-4xl font-bold mb-3 text-white">{journey.name}</h1>
        
        {/* Memory Stats Row - only show if no memories (preview card shows otherwise) */}
        {!memoriesLoading && memories.length === 0 && (
          <p className="text-white/50 mb-4 text-sm">No memories captured yet</p>
        )}
        
        {/* Memory type breakdown - compact version */}
        {memories.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-white/60">
            {photoCount > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>{photoCount}</span>
              </span>
            )}
            {noteCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{noteCount}</span>
              </span>
            )}
            {audioCount > 0 && (
              <span className="flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-orange-400" />
                <span>{audioCount}</span>
              </span>
            )}
          </div>
        )}
        
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

