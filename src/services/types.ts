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

