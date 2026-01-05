/**
 * Cached journey data hook using SWR
 * Shows cached data instantly, refreshes in background
 */

import useSWR from 'swr';
import { fetchActiveJourneys, fetchPastJourneys, getMemoryStreak } from '@/services';
import type { Journey } from '@/types';

interface JourneyData {
  activeJourneys: Journey[];
  pastJourneys: Journey[];
  streak: number;
}

async function fetchAllJourneyData(userId: string): Promise<JourneyData> {
  // Fetch everything in parallel
  const [activeResult, pastResult, streakResult] = await Promise.all([
    fetchActiveJourneys(userId),
    fetchPastJourneys(userId),
    getMemoryStreak(userId),
  ]);

  return {
    activeJourneys: activeResult.data || [],
    pastJourneys: pastResult.data || [],
    streak: streakResult.data ?? 0,
  };
}

export function useJourneys(userId: string | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    userId ? `journeys-${userId}` : null,
    () => fetchAllJourneyData(userId!),
    {
      // Show stale data immediately while revalidating
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Keep data fresh for 30 seconds
      dedupingInterval: 30000,
      // Don't retry on error (user can pull to refresh)
      errorRetryCount: 1,
      // Keep previous data while loading new data
      keepPreviousData: true,
    }
  );

  return {
    activeJourneys: data?.activeJourneys || [],
    pastJourneys: data?.pastJourneys || [],
    streak: data?.streak || 0,
    isLoading: isLoading && !data,
    isRefreshing: isValidating,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}

