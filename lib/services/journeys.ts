/**
 * Journey Service
 */

import { supabase } from '../supabase';
import type { Journey } from '@/types';

export interface CreateJourneyInput {
  userId: string;
  name: string;
  destination?: string;
  unlockDate: string;
  sharedWith?: string[];
}

export interface UpdateJourneyInput {
  id: string;
  name?: string;
  destination?: string;
  unlockDate?: string;
  status?: 'active' | 'completed';
  sharedWith?: string[];
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Create a new journey
 */
export async function createJourney(input: CreateJourneyInput): Promise<ServiceResult<Journey>> {
  try {
    const { data, error } = await supabase
      .from('journeys')
      .insert([{
        user_id: input.userId,
        name: input.name.trim(),
        destination: input.destination?.trim() || null,
        unlock_date: input.unlockDate,
        status: 'active',
        shared_with: input.sharedWith?.length ? input.sharedWith : null,
      }])
      .select()
      .single();

    if (error) {
      console.error('[JourneyService] Create error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Journey, error: null };
  } catch (err) {
    console.error('[JourneyService] Create exception:', err);
    return { data: null, error: 'Failed to create journey' };
  }
}

/**
 * Update an existing journey
 */
export async function updateJourney(input: UpdateJourneyInput): Promise<ServiceResult<Journey>> {
  try {
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.destination !== undefined) updates.destination = input.destination.trim() || null;
    if (input.unlockDate !== undefined) updates.unlock_date = input.unlockDate;
    if (input.status !== undefined) updates.status = input.status;
    if (input.sharedWith !== undefined) updates.shared_with = input.sharedWith.length > 0 ? input.sharedWith : null;

    const { data, error } = await supabase
      .from('journeys')
      .update(updates)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('[JourneyService] Update error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Journey, error: null };
  } catch (err) {
    console.error('[JourneyService] Update exception:', err);
    return { data: null, error: 'Failed to update journey' };
  }
}

/**
 * Delete a journey and all its memories
 */
export async function deleteJourney(journeyId: string): Promise<ServiceResult<boolean>> {
  try {
    // First delete all memories for this journey
    const { error: memoriesError } = await supabase
      .from('memories')
      .delete()
      .eq('journey_id', journeyId);

    if (memoriesError) {
      console.error('[JourneyService] Delete memories error:', memoriesError);
      return { data: null, error: memoriesError.message };
    }

    // Then delete the journey
    const { error: journeyError } = await supabase
      .from('journeys')
      .delete()
      .eq('id', journeyId);

    if (journeyError) {
      console.error('[JourneyService] Delete journey error:', journeyError);
      return { data: null, error: journeyError.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[JourneyService] Delete exception:', err);
    return { data: null, error: 'Failed to delete journey' };
  }
}

/**
 * Fetch active journeys with memory counts for a user
 */
export async function fetchActiveJourneys(userId: string): Promise<ServiceResult<Journey[]>> {
  try {
    const now = new Date().toISOString();

    // Fetch owned journeys
    const { data: ownedData, error: ownedError } = await supabase
      .from('journeys')
      .select('*')
      .eq('status', 'active')
      .eq('user_id', userId)
      .gt('unlock_date', now)
      .order('created_at', { ascending: false });

    // Fetch shared journeys
    const { data: sharedData, error: sharedError } = await supabase
      .from('journeys')
      .select('*')
      .eq('status', 'active')
      .contains('shared_with', [userId])
      .gt('unlock_date', now)
      .order('created_at', { ascending: false });

    if (ownedError || sharedError) {
      const error = ownedError || sharedError;
      console.error('[JourneyService] Fetch active error:', error);
      return { data: null, error: error?.message || 'Failed to fetch journeys' };
    }

    // Combine and deduplicate
    const allJourneys = [...(ownedData || []), ...(sharedData || [])];
    const uniqueJourneys = allJourneys.filter(
      (journey, index, self) => index === self.findIndex((j) => j.id === journey.id)
    );

    if (uniqueJourneys.length === 0) {
      return { data: [], error: null };
    }

    // Fetch memory counts in a single query
    const journeyIds = uniqueJourneys.map((j) => j.id);
    const { data: counts } = await supabase
      .from('memories')
      .select('journey_id')
      .in('journey_id', journeyIds);

    const countMap = new Map<string, number>();
    for (const memory of counts || []) {
      const current = countMap.get(memory.journey_id) || 0;
      countMap.set(memory.journey_id, current + 1);
    }

    const journeysWithCounts = uniqueJourneys.map((journey) => ({
      ...journey,
      memory_count: countMap.get(journey.id) || 0,
    })) as Journey[];

    return { data: journeysWithCounts, error: null };
  } catch (err) {
    console.error('[JourneyService] Fetch active exception:', err);
    return { data: null, error: 'Failed to fetch journeys' };
  }
}

/**
 * Fetch past/unlocked journeys with memory counts for a user
 */
export async function fetchPastJourneys(userId: string): Promise<ServiceResult<Journey[]>> {
  try {
    const now = new Date().toISOString();

    const { data: ownedData, error: ownedError } = await supabase
      .from('journeys')
      .select('*')
      .eq('user_id', userId)
      .or(`status.eq.completed,unlock_date.lte.${now}`)
      .order('created_at', { ascending: false });

    const { data: sharedData, error: sharedError } = await supabase
      .from('journeys')
      .select('*')
      .contains('shared_with', [userId])
      .or(`status.eq.completed,unlock_date.lte.${now}`)
      .order('created_at', { ascending: false });

    if (ownedError || sharedError) {
      const error = ownedError || sharedError;
      console.error('[JourneyService] Fetch past error:', error);
      return { data: null, error: error?.message || 'Failed to fetch journeys' };
    }

    const allJourneys = [...(ownedData || []), ...(sharedData || [])];
    const uniqueJourneys = allJourneys.filter(
      (journey, index, self) => index === self.findIndex((j) => j.id === journey.id)
    );

    if (uniqueJourneys.length === 0) {
      return { data: [], error: null };
    }

    const journeyIds = uniqueJourneys.map((j) => j.id);
    const { data: counts } = await supabase
      .from('memories')
      .select('journey_id')
      .in('journey_id', journeyIds);

    const countMap = new Map<string, number>();
    for (const memory of counts || []) {
      const current = countMap.get(memory.journey_id) || 0;
      countMap.set(memory.journey_id, current + 1);
    }

    const journeysWithCounts = uniqueJourneys.map((journey) => ({
      ...journey,
      memory_count: countMap.get(journey.id) || 0,
    })) as Journey[];

    return { data: journeysWithCounts, error: null };
  } catch (err) {
    console.error('[JourneyService] Fetch past exception:', err);
    return { data: null, error: 'Failed to fetch journeys' };
  }
}

/**
 * Delete all journeys and memories for a user (account deletion)
 */
export async function deleteAllUserJourneys(userId: string): Promise<ServiceResult<boolean>> {
  try {
    // Get all journey IDs first
    const { data: journeys, error: fetchError } = await supabase
      .from('journeys')
      .select('id')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('[JourneyService] Fetch for delete error:', fetchError);
      return { data: null, error: fetchError.message };
    }

    // Delete memories for all journeys
    if (journeys && journeys.length > 0) {
      for (const journey of journeys) {
        await supabase.from('memories').delete().eq('journey_id', journey.id);
      }
    }

    // Delete all journeys
    const { error: deleteError } = await supabase
      .from('journeys')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[JourneyService] Delete all error:', deleteError);
      return { data: null, error: deleteError.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[JourneyService] Delete all exception:', err);
    return { data: null, error: 'Failed to delete journeys' };
  }
}

