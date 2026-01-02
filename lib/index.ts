/**
 * Library exports
 */

// Services (data operations)
export * from './services';

// Utilities
export * from './utils';

// API helpers
export * from './api';

// Hooks
export * from './hooks';

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

// Constants
export * from './constants';

