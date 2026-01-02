/**
 * Library exports
 */

// Utilities
export * from './utils';

// API helpers
export * from './api';

// Error handling
export {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ExternalServiceError,
  isAppError,
  getErrorMessage,
  getErrorStatusCode,
  logError,
  safeJSONParse,
  withErrorHandling,
  createErrorResponse,
  ok,
  err,
  tryCatch,
  ErrorMessages,
  SuccessMessages,
  type Result,
} from './errors';

// Haptic feedback
export {
  haptic,
  hapticClick,
  hapticSuccess,
  hapticError,
  hapticSelection,
  type HapticType,
} from './haptics';

// Image compression
export {
  compressImage,
  compressDataUrl,
  getCompressionStats,
} from './imageCompression';

// Push notifications
export {
  registerServiceWorker,
  checkNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from './notifications';

// Supabase client (client-side only)
export { supabase } from './supabase';
// Note: Use createServerSupabaseClient from '@/lib/supabase-server' directly in server components

// Constants
export * from './constants';

