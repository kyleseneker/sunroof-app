/**
 * Optimized Supabase queries to avoid N+1 problems
 * 
 * Database migrations: /supabase/migrations/
 * Setup instructions: /supabase/README.md
 */

import { supabase } from './supabase';
import type { Journey } from '@/types';

export async function fetchActiveJourneysWithCounts(userId: string): Promise<{
  data: Journey[] | null;
  error: Error | null;
}> {
  try {
    const now = new Date().toISOString();

    const { data: ownedData, error: ownedError } = await supabase
      .from('journeys')
      .select('*')
      .eq('status', 'active')
      .eq('user_id', userId)
      .gt('unlock_date', now)
      .order('created_at', { ascending: false });

    const { data: sharedData, error: sharedError } = await supabase
      .from('journeys')
      .select('*')
      .eq('status', 'active')
      .contains('shared_with', [userId])
      .gt('unlock_date', now)
      .order('created_at', { ascending: false });

    if (ownedError || sharedError) {
      return { data: null, error: ownedError || sharedError };
    }

    const allJourneys = [...(ownedData || []), ...(sharedData || [])];
    const uniqueJourneys = allJourneys.filter(
      (journey, index, self) => index === self.findIndex((j) => j.id === journey.id)
    );

    if (uniqueJourneys.length === 0) {
      return { data: [], error: null };
    }

    // Fetch all memory counts in a single query
    const journeyIds = uniqueJourneys.map((j) => j.id);
    const { data: counts, error: countError } = await supabase
      .from('memories')
      .select('journey_id')
      .in('journey_id', journeyIds);

    if (countError) {
      console.error('Error fetching memory counts:', countError);
      return {
        data: uniqueJourneys.map((j) => ({ ...j, memory_count: 0 })) as Journey[],
        error: null,
      };
    }

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
    console.error('fetchActiveJourneysWithCounts error:', err);
    return { data: null, error: err as Error };
  }
}

export async function fetchPastJourneysWithCounts(userId: string): Promise<{
  data: Journey[] | null;
  error: Error | null;
}> {
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
      return { data: null, error: ownedError || sharedError };
    }

    const allJourneys = [...(ownedData || []), ...(sharedData || [])];
    const uniqueJourneys = allJourneys.filter(
      (journey, index, self) => index === self.findIndex((j) => j.id === journey.id)
    );

    if (uniqueJourneys.length === 0) {
      return { data: [], error: null };
    }

    const journeyIds = uniqueJourneys.map((j) => j.id);
    const { data: counts, error: countError } = await supabase
      .from('memories')
      .select('journey_id')
      .in('journey_id', journeyIds);

    if (countError) {
      console.error('Error fetching memory counts:', countError);
      return {
        data: uniqueJourneys.map((j) => ({ ...j, memory_count: 0 })) as Journey[],
        error: null,
      };
    }

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
    console.error('fetchPastJourneysWithCounts error:', err);
    return { data: null, error: err as Error };
  }
}
