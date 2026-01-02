'use client';

/**
 * Toast notification system with context provider
 */

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setRemoving(prev => new Set([...prev, id]));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      setRemoving(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 200);
  }, []);

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration && !removing.has(toast.id)) {
        const timer = setTimeout(() => removeToast(toast.id), toast.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removing, removeToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-[var(--color-success)]" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[var(--color-error)]" />;
      case 'info':
        return <Info className="w-4 h-4 text-[var(--color-info)]" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-[var(--color-success-subtle)] border-[var(--color-success)]/20';
      case 'error':
        return 'bg-[var(--color-error-subtle)] border-[var(--color-error)]/20';
      case 'info':
        return 'bg-[var(--color-info-subtle)] border-[var(--color-info)]/20';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none safe-bottom">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-2xl backdrop-blur-xl border',
              'flex items-center gap-3 min-w-[200px] max-w-[90vw]',
              getBgColor(toast.type),
              removing.has(toast.id) ? 'animate-toast-out' : 'animate-toast-in'
            )}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <p className="text-sm font-medium text-[var(--fg-base)]">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
