'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useToast, Modal, Button } from '@/components/ui';
import { updateJourney, getUserIdByEmail } from '@/services';
import { hapticSuccess, ErrorMessages } from '@/lib';
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
          showToast(ErrorMessages.SHARING_UNAVAILABLE, 'error');
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
        showToast(ErrorMessages.FETCH_FAILED('user'), 'error');
        setInviteLoading(false);
        return;
      }
      
      if (!existingUser) {
        showToast(ErrorMessages.USER_NOT_FOUND, 'error');
        setInviteLoading(false);
        return;
      }
      
      // Check if already shared
      if (currentShared.includes(existingUser)) {
        showToast(ErrorMessages.ALREADY_SHARED, 'error');
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
        showToast(ErrorMessages.UPDATE_FAILED('journey'), 'error');
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
      showToast(ErrorMessages.GENERIC, 'error');
    }
    
    setInviteLoading(false);
  };

  if (!journey) return null;

  return (
    <Modal
      isOpen={!!journey}
      onClose={handleClose}
      size="sm"
      showCloseButton={false}
      mobileTopAlign
    >
      <div className="text-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-[var(--color-info-subtle)] flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-6 h-6 text-[var(--color-info)]" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-[var(--fg-base)] mb-2">Share Journey</h3>

        {/* Description */}
        <p className="text-sm text-[var(--fg-muted)] mb-4">
          Invite someone to contribute to <span className="text-[var(--fg-base)]">{journey.name}</span>. 
          They&apos;ll be able to add memories and see the journey unlock.
        </p>
        
        {/* Current collaborators */}
        {(journey.shared_with?.length || 0) > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--bg-muted)] text-left">
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
            className="w-full h-12 px-4 bg-[var(--bg-surface)]/50 border border-[var(--border-base)] rounded-xl text-[var(--fg-base)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:border-[var(--color-info)] mb-4"
            autoFocus
          />
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!inviteEmail.trim()}
              loading={inviteLoading}
              fullWidth
            >
              Invite
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

