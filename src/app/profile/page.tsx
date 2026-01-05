'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, Avatar, Toggle, IconButton } from '@/components/ui';
import { NotificationSettings } from '@/components/features';
import { useTheme } from '@/providers';
import { formatDate, ErrorMessages, SuccessMessages } from '@/lib';
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
  LogOut, 
  Trash2, 
  Loader2,
  Check,
  Pencil,
  Download,
  Moon,
  Sun,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalJourneys: number;
  activeJourneys: number;
  totalMemories: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { resolvedTheme, toggleTheme } = useTheme();
  
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
  const [showNotifications, setShowNotifications] = useState(false);
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
        } else if (showNotifications) {
          setShowNotifications(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDeleteConfirm, isEditingName, showNotifications]);

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
      showToast(ErrorMessages.UPDATE_FAILED('name'), 'error');
    } else {
      showToast(SuccessMessages.UPDATED('Name'), 'success');
      setIsEditingName(false);
    }
    setSavingName(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showToast(ErrorMessages.INVALID_FILE_TYPE, 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(ErrorMessages.FILE_TOO_LARGE(5), 'error');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload avatar
      const { data: uploadData, error: uploadError } = await uploadAvatar(user.id, file);

      if (uploadError || !uploadData) {
        console.error('Upload error:', uploadError);
        showToast(ErrorMessages.UPLOAD_FAILED, 'error');
        setUploadingAvatar(false);
        return;
      }

      // Update user metadata
      const { error: updateError } = await updateProfile({ avatarUrl: uploadData.publicUrl });

      if (updateError) {
        showToast(ErrorMessages.SAVE_FAILED, 'error');
      } else {
        setAvatarUrl(uploadData.publicUrl);
        showToast(SuccessMessages.UPDATED('Avatar'), 'success');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast(ErrorMessages.UPLOAD_FAILED, 'error');
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
        showToast(ErrorMessages.DELETE_FAILED('avatar'), 'error');
      } else {
        setAvatarUrl(null);
        showToast(SuccessMessages.DELETED('Avatar'), 'success');
      }
    } catch (err) {
      console.error('Remove avatar error:', err);
      showToast(ErrorMessages.GENERIC, 'error');
    }
    
    setUploadingAvatar(false);
  };

  const handleSignOut = async () => {
    await serviceSignOut();
    showToast(SuccessMessages.SIGNED_OUT, 'success');
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
      showToast(SuccessMessages.DELETED('Your account'), 'success');
      router.push('/login');
    } catch (err) {
      console.error('Delete account error:', err);
      showToast(ErrorMessages.GENERIC, 'error');
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

      showToast(SuccessMessages.EXPORTED, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast(ErrorMessages.EXPORT_FAILED, 'error');
    }
    
    setIsExporting(false);
  };

  // Format dates with month + year only for profile stats
  const formatMonthYear = (dateStr: string) => formatDate(dateStr, { month: 'long', year: 'numeric' });

  // OAuth users have their avatar managed by the provider (e.g., Google)
  const isOAuthUser = !!user?.user_metadata?.picture;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <p className="text-white/50">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Notifications sheet
  if (showNotifications) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden safe-top safe-bottom">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
          {/* Ambient orbs */}
          <div className="absolute top-20 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10 p-4">
          <IconButton 
            icon={<ChevronLeft className="w-5 h-5" />}
            label="Back to profile"
            onClick={() => setShowNotifications(false)}
            variant="ghost"
            dark
          />
        </header>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                <Bell className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-3xl font-light text-white mb-2">Notifications</h1>
              <p className="text-white/50 text-sm">Stay updated on your journeys</p>
            </div>
            <NotificationSettings />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden safe-top safe-bottom">
      {/* Unified warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
        {/* Ambient orbs */}
        <div className="absolute top-20 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header - minimal, just the back button */}
      <header className="relative z-10 p-4">
        <Link href="/">
          <IconButton 
            icon={<ChevronLeft className="w-5 h-5" />}
            label="Back to dashboard"
            variant="ghost"
            dark
          />
        </Link>
      </header>

      {/* Hero section with avatar - NOT in scrollable area */}
      <div className="relative z-10 px-6 pb-6 text-center">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />
        
        {/* Large avatar with glow */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-2xl opacity-25" />
            <div className="relative">
              <Avatar
                src={avatarUrl}
                name={displayName}
                email={user?.email}
                size="xl"
                showUploadButton={false}
                showRemoveButton={false}
              />
              {!isOAuthUser && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Name, email, member since - in a card */}
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-center text-white text-xl font-light focus:outline-none focus:border-white/40"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <IconButton 
                icon={savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                label="Save name"
                onClick={handleSaveName}
                disabled={savingName}
                className="bg-white text-slate-900"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="group relative mb-1 block mx-auto"
            >
              <h2 className="text-2xl font-medium text-white">
                {displayName || 'Add your name'}
              </h2>
              <Pencil className="w-4 h-4 absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity text-white" />
            </button>
          )}
          
          <p className="text-white/60 text-sm text-center">{user?.email}</p>
          
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/40 text-xs text-center uppercase tracking-wider">
              Member since {formatMonthYear(user?.created_at || new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content below hero */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide safe-bottom">
        {/* Your Story - narrative stats */}
        <div className="px-6 mb-8">
          <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="text-center mb-4">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Your Story</p>
              <p className="text-white text-lg leading-relaxed">
                {stats.totalJourneys === 0 ? (
                  <>Your adventure is just beginning</>
                ) : stats.totalMemories === 0 ? (
                  <>You&apos;ve started <span className="text-amber-400 font-medium">{stats.totalJourneys}</span> {stats.totalJourneys === 1 ? 'journey' : 'journeys'} — time to capture some memories!</>
                ) : (
                  <>
                    You&apos;ve captured <span className="text-pink-400 font-medium">{stats.totalMemories}</span> {stats.totalMemories === 1 ? 'memory' : 'memories'} across <span className="text-amber-400 font-medium">{stats.totalJourneys}</span> {stats.totalJourneys === 1 ? 'journey' : 'journeys'}
                  </>
                )}
              </p>
            </div>
            
            {/* Visual journey indicator */}
            {stats.totalJourneys > 0 && (
              <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-white/10">
                {stats.activeJourneys > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">
                      {stats.activeJourneys} Active
                    </span>
                  </div>
                )}
                {stats.totalJourneys - stats.activeJourneys > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">
                      {stats.totalJourneys - stats.activeJourneys} in Vault
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings cards */}
        <div className="px-6 space-y-3 pb-6">
          {/* Appearance */}
          <button
            onClick={toggleTheme}
            className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              {resolvedTheme === 'dark' ? (
                <Moon className="w-5 h-5 text-amber-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium">Appearance</h3>
              <p className="text-white/50 text-sm">{resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
            </div>
            <Toggle 
              checked={resolvedTheme === 'dark'} 
              onChange={toggleTheme}
              label="Toggle dark mode"
            />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(true)}
            className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium">Notifications</h3>
              <p className="text-white/50 text-sm">Manage reminders</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </button>

          {/* Export Data */}
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-4 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              {isExporting ? (
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium">Export Data</h3>
              <p className="text-white/50 text-sm">Download your memories</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-white/60" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium">Sign Out</h3>
              <p className="text-white/50 text-sm">See you later!</p>
            </div>
          </button>

          {/* About */}
          <div className="pt-6">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-3 px-1">About</p>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Version</span>
                <span className="text-white/40 text-sm">1.0.0</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Made with ☀️ by</span>
                <span className="text-white/40 text-sm">Kyle Seneker</span>
              </div>
              <div className="h-px bg-white/10" />
              <a 
                href="mailto:hello@sunroof.app" 
                className="flex justify-between items-center group"
              >
                <span className="text-white/60 text-sm">Contact</span>
                <span className="text-amber-400 text-sm group-hover:underline">hello@getsunroof.com</span>
              </a>
            </div>
          </div>

          {/* Danger zone */}
          <div className="pt-6">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-3 px-1">Danger Zone</p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-red-400 font-medium">Delete Account</h3>
                <p className="text-red-400/50 text-sm">Permanently remove all data</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
          }}
        >
          <div 
            className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-light text-white text-center mb-2">Delete Account?</h2>
            <p className="text-white/50 text-sm text-center mb-6">
              This will permanently delete all your journeys and memories. This cannot be undone.
            </p>
            
            <div className="mb-6">
              <label className="text-xs text-white/40 mb-2 block text-center">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-mono text-white focus:outline-none focus:border-red-500/50"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 h-12 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
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

