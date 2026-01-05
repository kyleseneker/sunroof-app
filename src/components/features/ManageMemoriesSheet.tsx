'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Trash2, ImageIcon, FileText, Mic } from 'lucide-react';
import { useToast, ConfirmDialog, IconButton } from '@/components/ui';
import { fetchMemoriesForJourney, deleteMemory } from '@/services';
import { hapticSuccess } from '@/lib';
import type { Journey } from '@/types';

interface LockedMemory {
  id: string;
  type: 'photo' | 'text' | 'audio';
  created_at: string;
}

interface ManageMemoriesSheetProps {
  journey: Journey | null;
  onClose: () => void;
  onMemoryDeleted?: (journeyId: string, newCount: number) => void;
}

export default function ManageMemoriesSheet({
  journey,
  onClose,
  onMemoryDeleted,
}: ManageMemoriesSheetProps) {
  const { showToast } = useToast();
  
  const [lockedMemories, setLockedMemories] = useState<LockedMemory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<LockedMemory | null>(null);
  const [isDeletingMemory, setIsDeletingMemory] = useState(false);

  // Fetch locked memories when journey changes
  useEffect(() => {
    if (!journey) {
      setLockedMemories([]);
      return;
    }
    
    const fetchMemories = async () => {
      setLoadingMemories(true);
      const { data } = await fetchMemoriesForJourney(journey.id);
      // Only keep id, type, created_at for locked view (hide content)
      const lockedData = (data || []).map(m => ({ 
        id: m.id, 
        type: m.type, 
        created_at: m.created_at 
      }));
      setLockedMemories(lockedData);
      setLoadingMemories(false);
    };
    
    fetchMemories();
  }, [journey]);

  const handleDeleteMemory = async () => {
    if (!memoryToDelete || !journey || isDeletingMemory) return;
    
    setIsDeletingMemory(true);
    
    try {
      const { error } = await deleteMemory(memoryToDelete.id);
      
      if (error) {
        showToast('Failed to delete memory', 'error');
        setIsDeletingMemory(false);
        return;
      }
      
      const newMemories = lockedMemories.filter(m => m.id !== memoryToDelete.id);
      setLockedMemories(newMemories);
      setMemoryToDelete(null);
      
      // Notify parent of the new count
      onMemoryDeleted?.(journey.id, newMemories.length);
      
      hapticSuccess();
      showToast('Memory deleted', 'success');
    } catch (err) {
      console.error('Delete memory error:', err);
      showToast('Something went wrong', 'error');
    } finally {
      setIsDeletingMemory(false);
    }
  };

  if (!journey) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
      
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 flex items-center gap-4 p-6">
        <IconButton 
          icon={<X className="w-5 h-5" />}
          label="Close"
          onClick={onClose}
          variant="ghost"
          dark
        />
        <div className="flex-1">
          <h1 className="text-lg font-medium text-white">Manage Memories</h1>
          <p className="text-xs text-white/50">{journey.name} • {lockedMemories.length} memories</p>
        </div>
      </header>

      {/* Memory List */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4">
        {loadingMemories ? (
          /* Skeleton loader for memories */
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : lockedMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-white/50" />
            </div>
            <p className="text-white/50">No memories captured yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lockedMemories.map((memory, i) => {
              const memoryDate = new Date(memory.created_at);
              const formattedDate = memoryDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              });
              return (
                <div 
                  key={memory.id}
                  className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl animate-enter"
                  style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
                      {memory.type === 'photo' ? (
                        <ImageIcon className="w-5 h-5 text-amber-400" />
                      ) : memory.type === 'audio' ? (
                        <Mic className="w-5 h-5 text-amber-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {memory.type === 'photo' ? 'Photo' : memory.type === 'audio' ? 'Audio' : 'Note'}
                      </p>
                      <p className="text-xs text-white/50">{formattedDate}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMemoryToDelete(memory)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Memory Confirmation */}
      <ConfirmDialog
        isOpen={!!memoryToDelete}
        onClose={() => setMemoryToDelete(null)}
        onConfirm={handleDeleteMemory}
        title="Delete this memory?"
        description={`This ${memoryToDelete?.type === 'photo' ? 'photo' : memoryToDelete?.type === 'audio' ? 'audio' : 'note'} will be permanently deleted. You won't be able to recover it.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeletingMemory}
      />
    </div>
  );
}

