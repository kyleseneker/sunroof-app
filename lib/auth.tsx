'use client';

/**
 * Authentication context and hooks
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/auth/callback', '/privacy', '/terms'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleAuthChange = useCallback((event: AuthChangeEvent, session: Session | null) => {
    // Ignore USER_UPDATED to prevent redirect loops when profile changes
    if (event === 'USER_UPDATED') {
      if (session?.user) {
        setUser(session.user);
        setSession(session);
      }
      return;
    }

    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);

    if (event === 'SIGNED_OUT' && !PUBLIC_ROUTES.includes(pathname)) {
      router.push('/login');
    }

    if (event === 'SIGNED_IN' && session && pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => subscription.unsubscribe();
  }, [handleAuthChange]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        if (!PUBLIC_ROUTES.includes(pathname)) {
          setUser(null);
          setSession(null);
          router.push('/login');
        }
      }
    };

    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pathname, router]);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : undefined,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
