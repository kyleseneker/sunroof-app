'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, ChevronRight, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui';
import { NotificationSettings } from '@/components/features';
import { getCurrentUser, getJourneyCounts, exportUserData, deleteAllUserJourneysData } from '@/services';
import { APP_VERSION } from '@/lib';

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeCount, setActiveCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndFetchCounts() {
      const { data: user } = await getCurrentUser();
      
      // Redirect to login if not authenticated
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: counts } = await getJourneyCounts(user.id);
      if (counts) {
        setActiveCount(counts.active);
        setArchivedCount(counts.archived);
      }
      
      setLoading(false);
    }
    checkAuthAndFetchCounts();
  }, [router]);

  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export all user data as JSON (GDPR compliance)
  const handleExportData = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      const { data: user } = await getCurrentUser();
      if (!user) {
        showToast('You must be signed in', 'error');
        setIsExporting(false);
        return;
      }

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

  const handleClearAllData = async () => {
    if (isClearing) return;
    
    if (confirm('Are you sure you want to delete ALL journeys and memories? This cannot be undone.')) {
      setIsClearing(true);
      
      try {
        const { error } = await deleteAllUserJourneysData();
        
        if (error) {
          console.error('Clear data error:', error);
          showToast('Failed to clear data', 'error');
          setIsClearing(false);
          return;
        }
        
        showToast('All data cleared', 'success');
        router.push('/');
      } catch (err) {
        console.error('Clear data exception:', err);
        showToast('Something went wrong', 'error');
        setIsClearing(false);
      }
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="flex items-center gap-4 p-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-zinc-400" />
            <h1 className="text-lg font-medium">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide p-6">
        <div className="max-w-sm mx-auto w-full space-y-4">
          {/* App Info */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">About</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Version</span>
                <span className="text-sm font-mono">{APP_VERSION}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Active Journeys</span>
                <span className="text-sm">{activeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Archived Journeys</span>
                <span className="text-sm">{archivedCount}</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Notifications</h3>
            <NotificationSettings />
          </div>

          {/* Data */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Your Data</h3>
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
              <p className="text-xs text-zinc-600 px-1">
                Download all your journeys and memories as a JSON file
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass rounded-2xl p-4 border border-red-500/10">
            <h3 className="text-sm font-medium text-red-400/80 mb-3">Danger Zone</h3>
            <div className="space-y-2">
              <button
                onClick={handleClearAllData}
                disabled={isClearing}
                className="w-full text-left px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-sm text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearing ? 'Deleting...' : 'Delete All Data'}
              </button>
              <p className="text-xs text-zinc-600 px-1">
                Permanently removes all journeys and memories
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Legal</h3>
            <div className="space-y-2">
              <Link
                href="/privacy"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm"
              >
                Privacy Policy
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>
              <Link
                href="/terms"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm"
              >
                Terms of Service
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 text-center space-y-2">
            <p className="text-xs text-zinc-600">Made with ☀️ for capturing moments</p>
            <p className="text-[10px] text-zinc-700">
              © {new Date().getFullYear()} Sunroof. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

