'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, Avatar, ThemeToggle } from '@/components/ui';
import { NotificationSettings } from '@/components/features';
import { formatDate } from '@/lib';
import { 
  getCurrentUser, 
  getProfileStats, 
  updateProfile, 
  uploadAvatar, 
  removeAvatar,
  signOut as serviceSignOut,
  deleteAllUserJourneys,
  deleteAllUserStorage,
  exportUserData,
} from '@/services';
import { 
  ArrowLeft, 
  LogOut, 
  Trash2, 
  Loader2,
  Check,
  Pencil,
  Download
} from 'lucide-react';

interface Stats {
  totalJourneys: number;
  activeJourneys: number;
  totalMemories: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalJourneys: 0,
    activeJourneys: 0,
    totalMemories: 0,
  });
  
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setDeleteConfirmText('');
        } else if (isEditingName) {
          setIsEditingName(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDeleteConfirm, isEditingName]);

  useEffect(() => {
    async function loadProfile() {
      const { data: user } = await getCurrentUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
      
      // Fetch stats using service
      const { data: statsData } = await getProfileStats(user.id);
      
      if (statsData) {
        setStats(statsData);
      }
      
      setLoading(false);
    }
    
    loadProfile();
  }, [router]);

  const handleSaveName = async () => {
    if (!user) return;
    setSavingName(true);
    
    const { error } = await updateProfile({ displayName: displayName.trim() });
    
    if (error) {
      showToast('Failed to update name', 'error');
    } else {
      showToast('Name updated!', 'success');
      setIsEditingName(false);
    }
    setSavingName(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload avatar
      const { data: uploadData, error: uploadError } = await uploadAvatar(user.id, file);

      if (uploadError || !uploadData) {
        console.error('Upload error:', uploadError);
        showToast('Failed to upload image', 'error');
        setUploadingAvatar(false);
        return;
      }

      // Update user metadata
      const { error: updateError } = await updateProfile({ avatarUrl: uploadData.publicUrl });

      if (updateError) {
        showToast('Failed to save avatar', 'error');
      } else {
        setAvatarUrl(uploadData.publicUrl);
        showToast('Avatar updated!', 'success');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast('Failed to upload avatar', 'error');
    }

    setUploadingAvatar(false);
    // Clear input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    setUploadingAvatar(true);
    
    try {
      // Remove avatar from storage
      await removeAvatar(user.id);

      // Update user metadata
      const { error } = await updateProfile({ avatarUrl: null });

      if (error) {
        showToast('Failed to remove avatar', 'error');
      } else {
        setAvatarUrl(null);
        showToast('Avatar removed', 'success');
      }
    } catch (err) {
      console.error('Remove avatar error:', err);
      showToast('Failed to remove avatar', 'error');
    }
    
    setUploadingAvatar(false);
  };

  const handleSignOut = async () => {
    await serviceSignOut();
    showToast('Signed out', 'success');
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;
    
    try {
      // Delete all user data
      await deleteAllUserJourneys(user.id);
      
      // Delete storage files (avatars, media)
      await deleteAllUserStorage(user.id);
      
      // Sign out
      await serviceSignOut();
      showToast('Your account has been deleted', 'success');
      router.push('/login');
    } catch (err) {
      console.error('Delete account error:', err);
      showToast('Failed to delete account. Please try again.', 'error');
    }
  };

  const handleExportData = async () => {
    if (isExporting || !user) return;
    setIsExporting(true);
    
    try {
      const { data: exportData, error } = await exportUserData(
        user.id,
        user.email,
        user.user_metadata?.display_name
      );

      if (error || !exportData) {
        throw new Error(error || 'Failed to export');
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sunroof-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Data exported successfully', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export data', 'error');
    }
    
    setIsExporting(false);
  };

  // Format dates with month + year only for profile stats
  const formatMonthYear = (dateStr: string) => formatDate(dateStr, { month: 'short', year: 'numeric' });

  // OAuth users have their avatar managed by the provider (e.g., Google)
  const isOAuthUser = !!user?.user_metadata?.picture;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-base)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--fg-subtle)]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] text-[var(--fg-base)] flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex items-center gap-4 p-6 bg-gradient-to-b from-[var(--bg-base)]/80 to-transparent backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-medium">Profile</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
        <div className="max-w-sm mx-auto w-full space-y-6">
          
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              
              {/* Avatar - hide upload/remove for OAuth users (managed by provider) */}
              <Avatar
                src={avatarUrl}
                name={displayName}
                email={user?.email}
                size="xl"
                showUploadButton={!isOAuthUser}
                showRemoveButton={!!avatarUrl && !isOAuthUser}
                uploading={uploadingAvatar}
                onUploadClick={() => fileInputRef.current?.click()}
                onRemoveClick={handleRemoveAvatar}
              />
            </div>
            
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-center focus:outline-none focus:border-[var(--fg-subtle)]"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-2 text-xl font-medium hover:text-[var(--fg-muted)] transition-colors group"
              >
                {displayName || 'Add your name'}
                <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            
            <p className="text-[var(--fg-muted)] text-sm mt-1">{user?.email}</p>
            <p className="text-[var(--fg-subtle)] text-xs mt-0.5">
              Member since {formatMonthYear(user?.created_at || new Date().toISOString())}
            </p>
          </div>

          {/* Stats */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)] mb-4">Your Stats</h3>
            <div className="grid grid-cols-3 gap-3 stagger-children">
              <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl border border-orange-500/10">
                <div className="text-3xl font-bold text-orange-400 counter">{stats.totalJourneys}</div>
                <div className="text-xs text-[var(--fg-muted)] mt-1">Journeys</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl border border-blue-500/10">
                <div className="text-3xl font-bold text-blue-400 counter">{stats.activeJourneys}</div>
                <div className="text-xs text-[var(--fg-muted)] mt-1">Active</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-2xl border border-pink-500/10">
                <div className="text-3xl font-bold text-pink-400 counter">{stats.totalMemories}</div>
                <div className="text-xs text-[var(--fg-muted)] mt-1">Memories</div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)] mb-3">Notifications</h3>
            <NotificationSettings />
          </div>

          {/* Appearance */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)] mb-3">Appearance</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--fg-base)]">Theme</span>
              <ThemeToggle showSystemOption />
            </div>
          </div>

          {/* Your Data */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)] mb-3">Your Data</h3>
            <div className="space-y-2">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-sm text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export All Data'}
              </button>
              <p className="text-xs text-[var(--fg-subtle)] px-1">
                Download all your journeys and memories as JSON
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="group w-full flex items-center justify-center gap-2 h-14 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-medium transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Sign Out
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 h-14 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-sm font-medium text-red-400 transition-all active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[60] bg-[var(--bg-base)]/90 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
          }}
        >
          <div 
            className="glass rounded-2xl p-6 max-w-sm w-full animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[var(--color-error-subtle)] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-[var(--color-error)]" />
            </div>
            
            <h2 className="text-xl font-semibold text-center mb-2">Delete Account?</h2>
            <p className="text-[var(--fg-muted)] text-sm text-center mb-6">
              This will permanently delete all your journeys and memories. This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="text-xs text-[var(--fg-muted)] mb-2 block">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg px-4 py-3 text-center font-mono focus:outline-none focus:border-[var(--color-error)]"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 h-12 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 h-12 bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 disabled:bg-[var(--color-error)]/30 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

