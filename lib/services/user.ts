/**
 * User Service
 */

import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';
import type { ServiceResult } from './types';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<ServiceResult<User>> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[UserService] Get user error:', error);
      return { data: null, error: error.message };
    }

    return { data: user, error: null };
  } catch (err) {
    console.error('[UserService] Get user exception:', err);
    return { data: null, error: 'Failed to get user' };
  }
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
}

/**
 * Update user profile metadata
 */
export async function updateProfile(input: UpdateProfileInput): Promise<ServiceResult<boolean>> {
  try {
    const updates: Record<string, unknown> = {};
    
    if (input.displayName !== undefined) {
      updates.display_name = input.displayName.trim();
    }
    if (input.avatarUrl !== undefined) {
      updates.avatar_url = input.avatarUrl;
    }

    const { error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      console.error('[UserService] Update profile error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[UserService] Update profile exception:', err);
    return { data: null, error: 'Failed to update profile' };
  }
}

/**
 * Get user profile stats (journey count, memory count, etc.)
 */
export async function getProfileStats(userId: string): Promise<ServiceResult<{
  totalJourneys: number;
  activeJourneys: number;
  totalMemories: number;
  firstJourneyDate: string | null;
}>> {
  try {
    const now = new Date().toISOString();

    // Fetch journeys
    const { data: journeyData, error: journeyError } = await supabase
      .from('journeys')
      .select('id, status, unlock_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (journeyError) {
      console.error('[UserService] Fetch journeys error:', journeyError);
      return { data: null, error: journeyError.message };
    }

    // Count memories
    let memoryCount = 0;
    if (journeyData && journeyData.length > 0) {
      const { count } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .in('journey_id', journeyData.map(j => j.id));
      
      memoryCount = count || 0;
    }

    return {
      data: {
        totalJourneys: journeyData?.length || 0,
        activeJourneys: journeyData?.filter(j => j.status === 'active' && j.unlock_date > now).length || 0,
        totalMemories: memoryCount,
        firstJourneyDate: journeyData?.[0]?.created_at || null,
      },
      error: null,
    };
  } catch (err) {
    console.error('[UserService] Get stats exception:', err);
    return { data: null, error: 'Failed to get profile stats' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[UserService] Sign out error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[UserService] Sign out exception:', err);
    return { data: null, error: 'Failed to sign out' };
  }
}

/**
 * Look up a user ID by email (for sharing)
 */
export async function getUserIdByEmail(email: string): Promise<ServiceResult<string>> {
  try {
    const { data, error } = await supabase.rpc('get_user_id_by_email', { 
      email_input: email.trim().toLowerCase() 
    });

    if (error) {
      console.error('[UserService] Get user by email error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as string, error: null };
  } catch (err) {
    console.error('[UserService] Get user by email exception:', err);
    return { data: null, error: 'Failed to find user' };
  }
}

/**
 * Look up an email by user ID (for displaying collaborators)
 */
export async function getEmailByUserId(userId: string): Promise<ServiceResult<string>> {
  try {
    const { data, error } = await supabase.rpc('get_email_by_user_id', { 
      user_id_input: userId 
    });

    if (error) {
      console.error('[UserService] Get email by user ID error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as string, error: null };
  } catch (err) {
    console.error('[UserService] Get email by user ID exception:', err);
    return { data: null, error: 'Failed to find email' };
  }
}

