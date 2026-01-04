/**
 * User Service
 */

import { supabase } from '@/lib';
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
}>> {
  try {
    const now = new Date().toISOString();

    // Fetch journeys
    const { data: journeyData, error: journeyError } = await supabase
      .from('journeys')
      .select('id, status, unlock_date')
      .eq('user_id', userId);

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
      },
      error: null,
    };
  } catch (err) {
    console.error('[UserService] Get stats exception:', err);
    return { data: null, error: 'Failed to get profile stats' };
  }
}

/**
 * Get user's current memory streak (consecutive days with memories)
 */
export async function getMemoryStreak(userId: string): Promise<ServiceResult<number>> {
  try {
    // Get user's journey IDs
    const { data: journeys, error: journeyError } = await supabase
      .from('journeys')
      .select('id')
      .eq('user_id', userId);

    if (journeyError) {
      console.error('[UserService] Fetch journeys for streak error:', journeyError);
      return { data: null, error: journeyError.message };
    }

    if (!journeys || journeys.length === 0) {
      return { data: 0, error: null };
    }

    // Fetch memory dates for all journeys
    const { data: memories, error: memoryError } = await supabase
      .from('memories')
      .select('created_at')
      .in('journey_id', journeys.map(j => j.id))
      .order('created_at', { ascending: false });

    if (memoryError) {
      console.error('[UserService] Fetch memories for streak error:', memoryError);
      return { data: null, error: memoryError.message };
    }

    if (!memories || memories.length === 0) {
      return { data: 0, error: null };
    }

    // Get unique dates (as YYYY-MM-DD strings in local time)
    const uniqueDates = [...new Set(
      memories.map(m => {
        const date = new Date(m.created_at);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
    )].sort().reverse(); // Most recent first

    // Calculate streak from today
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let streak = 0;
    let checkDate = new Date(today);

    // If no memory today, check if there was one yesterday to start the streak
    if (uniqueDates[0] !== todayStr) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (const dateStr of uniqueDates) {
      const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      
      if (dateStr === checkStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr < checkStr) {
        // Gap in dates, streak ends
        break;
      }
    }

    return { data: streak, error: null };
  } catch (err) {
    console.error('[UserService] Get streak exception:', err);
    return { data: null, error: 'Failed to calculate streak' };
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

