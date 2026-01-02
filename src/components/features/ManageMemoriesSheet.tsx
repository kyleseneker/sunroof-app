'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Trash2, ImageIcon, FileText, Mic } from 'lucide-react';
import { useToast, ConfirmDialog } from '@/components/ui';
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
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 border-b border-[var(--border-base)]">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center"
        >
          <X className="w-5 h-5 text-[var(--fg-muted)]" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-[var(--fg-base)]">Manage Memories</h1>
          <p className="text-xs text-[var(--fg-muted)]">{journey.name} • {lockedMemories.length} memories</p>
        </div>
      </header>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingMemories ? (
          /* Skeleton loader for memories */
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded skeleton" />
                  <div className="h-3 w-16 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : lockedMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[var(--fg-subtle)]" />
            </div>
            <p className="text-[var(--fg-muted)]">No memories captured yet</p>
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
                  className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl animate-enter"
                  style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center">
                      {memory.type === 'photo' ? (
                        <ImageIcon className="w-5 h-5 text-pink-400" />
                      ) : memory.type === 'audio' ? (
                        <Mic className="w-5 h-5 text-orange-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[var(--fg-base)]">
                        {memory.type === 'photo' ? 'Photo' : memory.type === 'audio' ? 'Voice Note' : 'Note'}
                      </p>
                      <p className="text-xs text-[var(--fg-muted)]">{formattedDate}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMemoryToDelete(memory)}
                    className="w-10 h-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center hover:bg-[var(--color-error-subtle)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--fg-muted)]" />
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
        description={`This ${memoryToDelete?.type === 'photo' ? 'photo' : memoryToDelete?.type === 'audio' ? 'voice note' : 'note'} will be permanently deleted. You won't be able to recover it.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeletingMemory}
      />
    </div>
  );
}

