'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui';
import { updateJourney, getUserIdByEmail } from '@/services';
import { hapticSuccess } from '@/lib';
import type { Journey } from '@/types';

interface InviteCollaboratorModalProps {
  journey: Journey | null;
  onClose: () => void;
  onSuccess?: (updatedJourney: Journey) => void;
}

export default function InviteCollaboratorModal({
  journey,
  onClose,
  onSuccess,
}: InviteCollaboratorModalProps) {
  const { showToast } = useToast();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleClose = () => {
    setInviteEmail('');
    onClose();
  };

  const handleInvite = async () => {
    if (!journey || !inviteEmail.trim()) return;
    
    setInviteLoading(true);
    
    try {
      const currentShared = journey.shared_with || [];
      
      // Get user ID from email
      const { data: existingUser, error: lookupError } = await getUserIdByEmail(inviteEmail.trim().toLowerCase());
      
      if (lookupError) {
        if (lookupError.includes('function') || lookupError.includes('does not exist')) {
          showToast('Sharing feature requires database setup. See console for SQL.', 'error');
          console.log(`
-- Run this SQL in Supabase to enable email lookup:
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS UUID AS $$
  SELECT id FROM auth.users WHERE email = email_input LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
          `);
          setInviteLoading(false);
          return;
        }
        showToast('Failed to find user', 'error');
        setInviteLoading(false);
        return;
      }
      
      if (!existingUser) {
        showToast('No account found. They\'ll need to sign up first.', 'error');
        setInviteLoading(false);
        return;
      }
      
      // Check if already shared
      if (currentShared.includes(existingUser)) {
        showToast('Already shared with this person', 'error');
        setInviteLoading(false);
        return;
      }
      
      // Add to shared_with array
      const newSharedWith = [...currentShared, existingUser];
      const { error: updateError } = await updateJourney({
        id: journey.id,
        sharedWith: newSharedWith,
      });
      
      if (updateError) {
        showToast('Failed to share journey', 'error');
        setInviteLoading(false);
        return;
      }
      
      hapticSuccess();
      showToast(`Shared with ${inviteEmail}!`, 'success');
      
      // Return updated journey
      onSuccess?.({
        ...journey,
        shared_with: newSharedWith,
      });
      
      handleClose();
    } catch (err) {
      console.error('Invite error:', err);
      showToast('Failed to invite collaborator', 'error');
    }
    
    setInviteLoading(false);
  };

  if (!journey) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] bg-[var(--bg-base)]/90 backdrop-blur-md flex items-center justify-center p-6 safe-top safe-bottom"
      onClick={handleClose}
    >
      <div 
        className="bg-[var(--bg-surface)] rounded-2xl p-6 max-w-sm w-full animate-enter border border-[var(--border-base)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-info-subtle)] flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[var(--color-info)]" />
            </div>
            <h2 className="text-lg font-medium text-[var(--fg-base)]">Share Journey</h2>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[var(--fg-muted)]" />
          </button>
        </div>
        
        <p className="text-sm text-[var(--fg-muted)] mb-4">
          Invite someone to contribute to <span className="text-[var(--fg-base)]">{journey.name}</span>. 
          They&apos;ll be able to add memories and see the journey unlock.
        </p>
        
        {/* Current collaborators */}
        {(journey.shared_with?.length || 0) > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--bg-hover)]">
            <p className="text-xs text-[var(--fg-muted)] mb-2">Already shared with:</p>
            <div className="flex flex-wrap gap-2">
              {journey.shared_with?.map((userId, i) => (
                <div key={i} className="px-3 py-1 rounded-full bg-[var(--color-info-subtle)] text-[var(--color-info)] text-xs">
                  Collaborator {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }}>
          <input
            type="email"
            placeholder="Enter their email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full h-12 px-4 bg-[var(--bg-muted)] border border-[var(--border-base)] rounded-xl text-[var(--fg-base)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:border-[var(--color-info)] mb-4"
            autoFocus
          />
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-12 bg-[var(--bg-hover)] text-[var(--fg-base)] rounded-xl font-medium hover:bg-[var(--bg-active)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inviteEmail.trim() || inviteLoading}
              className="flex-1 h-12 bg-[var(--color-info)] text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              {inviteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

