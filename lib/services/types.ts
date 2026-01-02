/**
 * Common types for Service Layer
 */

/**
 * Standard result type for all service operations.
 * Uses `data` for success and `error` for failure messages.
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Helper to create a success result
 */
export function success<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

/**
 * Helper to create an error result
 */
export function failure<T = never>(error: string): ServiceResult<T> {
  return { data: null, error };
}

