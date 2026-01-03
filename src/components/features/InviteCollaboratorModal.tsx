'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useToast, Modal, Button } from '@/components/ui';
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
    <Modal
      isOpen={!!journey}
      onClose={handleClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-6 h-6 text-blue-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-white mb-2">Share Journey</h3>

        {/* Description */}
        <p className="text-sm text-zinc-500 mb-4">
          Invite someone to contribute to <span className="text-white">{journey.name}</span>. 
          They&apos;ll be able to add memories and see the journey unlock.
        </p>
        
        {/* Current collaborators */}
        {(journey.shared_with?.length || 0) > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-800/50 text-left">
            <p className="text-xs text-zinc-500 mb-2">Already shared with:</p>
            <div className="flex flex-wrap gap-2">
              {journey.shared_with?.map((userId, i) => (
                <div key={i} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
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
            className="w-full h-12 px-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 mb-4"
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

