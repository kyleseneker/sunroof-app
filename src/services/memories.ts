/**
 * Memory Service
 */

import { supabase } from '@/lib';
import type { Memory } from '@/types';
import type { ServiceResult } from './types';

export interface CreateMemoryInput {
  journeyId: string;
  type: 'photo' | 'note' | 'audio';
  content?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
}

/**
 * Create a new memory (photo, note, or audio)
 */
export async function createMemory(input: CreateMemoryInput): Promise<ServiceResult<Memory>> {
  try {
    // Map type 'note' to database type 'text'
    const dbType = input.type === 'note' ? 'text' : input.type;
    
    // Determine URL based on type
    const url = input.type === 'audio' ? input.audioUrl : input.imageUrl;
    
    const { data, error } = await supabase
      .from('memories')
      .insert([{
        journey_id: input.journeyId,
        type: dbType,
        note: input.content || null,
        url: url || null,
        duration: input.duration || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('[MemoryService] Create error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Memory, error: null };
  } catch (err) {
    console.error('[MemoryService] Create exception:', err);
    return { data: null, error: 'Failed to create memory' };
  }
}

/**
 * Delete a single memory
 */
export async function deleteMemory(memoryId: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId);

    if (error) {
      console.error('[MemoryService] Delete error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[MemoryService] Delete exception:', err);
    return { data: null, error: 'Failed to delete memory' };
  }
}

/**
 * Fetch all memories for a journey
 */
export async function fetchMemoriesForJourney(journeyId: string): Promise<ServiceResult<Memory[]>> {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[MemoryService] Fetch error:', error);
      return { data: null, error: error.message };
    }

    return { data: (data || []) as Memory[], error: null };
  } catch (err) {
    console.error('[MemoryService] Fetch exception:', err);
    return { data: null, error: 'Failed to fetch memories' };
  }
}

/**
 * Get memory count for a journey
 */
export async function getMemoryCount(journeyId: string): Promise<ServiceResult<number>> {
  try {
    const { count, error } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true })
      .eq('journey_id', journeyId);

    if (error) {
      console.error('[MemoryService] Count error:', error);
      return { data: null, error: error.message };
    }

    return { data: count || 0, error: null };
  } catch (err) {
    console.error('[MemoryService] Count exception:', err);
    return { data: null, error: 'Failed to count memories' };
  }
}

/**
 * Delete all memories for a journey
 */
export async function deleteAllMemoriesForJourney(journeyId: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('journey_id', journeyId);

    if (error) {
      console.error('[MemoryService] Delete all error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[MemoryService] Delete all exception:', err);
    return { data: null, error: 'Failed to delete memories' };
  }
}

/**
 * Delete all memories for a user (for account deletion in settings)
 * This is a dangerous operation - use with caution
 */
export async function deleteAllUserMemories(): Promise<ServiceResult<boolean>> {
  try {
    // Using neq to a non-existent ID effectively deletes all for this user
    // RLS ensures only the user's memories are deleted
    const { error } = await supabase
      .from('memories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('[MemoryService] Delete all user memories error:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[MemoryService] Delete all user memories exception:', err);
    return { data: null, error: 'Failed to delete memories' };
  }
}

/**
 * Delete all journeys AND memories for a user (settings clear data)
 * RLS ensures only the user's data is deleted
 */
export async function deleteAllUserJourneysData(): Promise<ServiceResult<boolean>> {
  try {
    // Delete memories first
    const { error: memoriesError } = await supabase
      .from('memories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (memoriesError) {
      console.error('[MemoryService] Delete all user memories error:', memoriesError);
      return { data: null, error: memoriesError.message };
    }

    // Then delete journeys
    const { error: journeysError } = await supabase
      .from('journeys')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (journeysError) {
      console.error('[MemoryService] Delete all user journeys error:', journeysError);
      return { data: null, error: journeysError.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[MemoryService] Delete all user data exception:', err);
    return { data: null, error: 'Failed to delete data' };
  }
}

