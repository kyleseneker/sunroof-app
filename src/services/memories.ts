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
 * Extract storage path from a storage URL
 */
function extractStoragePath(url: string): string | null {
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/sunroof-media/userId/journeyId/filename
    const match = url.match(/\/sunroof-media\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Delete a single memory (including storage file if applicable)
 */
export async function deleteMemory(memoryId: string): Promise<ServiceResult<boolean>> {
  try {
    // First, fetch the memory to get its URL (for storage cleanup)
    const { data: memory, error: fetchError } = await supabase
      .from('memories')
      .select('url, type')
      .eq('id', memoryId)
      .single();

    if (fetchError) {
      console.error('[MemoryService] Fetch for delete error:', fetchError);
      // Continue with deletion even if fetch fails
    }

    // Delete the storage file if it exists (for photo/audio types)
    if (memory?.url && (memory.type === 'photo' || memory.type === 'audio')) {
      const storagePath = extractStoragePath(memory.url);
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('sunroof-media')
          .remove([storagePath]);

        if (storageError) {
          console.error('[MemoryService] Storage delete error:', storageError);
          // Continue with DB deletion even if storage delete fails
        }
      }
    }

    // Delete the database record
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
    // First, fetch all memories to get their URLs for storage cleanup
    const { data: memories, error: fetchError } = await supabase
      .from('memories')
      .select('url, type')
      .eq('journey_id', journeyId);

    if (fetchError) {
      console.error('[MemoryService] Fetch for bulk delete error:', fetchError);
      // Continue with deletion even if fetch fails
    }

    // Delete storage files for photo/audio memories
    if (memories && memories.length > 0) {
      const storagePaths = memories
        .filter(m => m.url && (m.type === 'photo' || m.type === 'audio'))
        .map(m => extractStoragePath(m.url))
        .filter((path): path is string => path !== null);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('sunroof-media')
          .remove(storagePaths);

        if (storageError) {
          console.error('[MemoryService] Bulk storage delete error:', storageError);
          // Continue with DB deletion even if storage delete fails
        }
      }
    }

    // Delete the database records
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
export async function deleteAllUserJourneysData(userId: string): Promise<ServiceResult<boolean>> {
  try {
    // First, get all journey IDs for this user
    const { data: journeys, error: journeysFetchError } = await supabase
      .from('journeys')
      .select('id')
      .eq('user_id', userId);

    if (journeysFetchError) {
      console.error('[MemoryService] Fetch journeys for delete error:', journeysFetchError);
    }

    // Delete storage files for all memories in user's journeys
    if (journeys && journeys.length > 0) {
      const journeyIds = journeys.map(j => j.id);
      
      const { data: memories } = await supabase
        .from('memories')
        .select('url, type')
        .in('journey_id', journeyIds);

      if (memories && memories.length > 0) {
        const storagePaths = memories
          .filter(m => m.url && (m.type === 'photo' || m.type === 'audio'))
          .map(m => extractStoragePath(m.url))
          .filter((path): path is string => path !== null);

        if (storagePaths.length > 0) {
          await supabase.storage.from('sunroof-media').remove(storagePaths);
        }
      }
    }

    // Delete memories
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

