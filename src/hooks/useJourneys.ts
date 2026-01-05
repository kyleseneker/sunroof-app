/**
 * Cached journey data hook using SWR
 * Shows cached data instantly, refreshes in background
 */

import useSWR from 'swr';
import { fetchActiveJourneys, fetchPastJourneys } from '@/services';
import type { Journey } from '@/types';

interface JourneyData {
  activeJourneys: Journey[];
  pastJourneys: Journey[];
}

async function fetchAllJourneyData(userId: string): Promise<JourneyData> {
  // Fetch everything in parallel
  const [activeResult, pastResult] = await Promise.all([
    fetchActiveJourneys(userId),
    fetchPastJourneys(userId),
  ]);

  return {
    activeJourneys: activeResult.data || [],
    pastJourneys: pastResult.data || [],
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
    isLoading: isLoading && !data,
    isRefreshing: isValidating,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}
