/**
 * Service Layer
 */

// Journey operations
export {
  createJourney,
  updateJourney,
  deleteJourney,
  fetchActiveJourneys,
  fetchPastJourneys,
  deleteAllUserJourneys,
  type CreateJourneyInput,
  type UpdateJourneyInput,
} from './journeys';

// Memory operations
export {
  createMemory,
  deleteMemory,
  fetchMemoriesForJourney,
  getMemoryCount,
  deleteAllMemoriesForJourney,
  deleteAllUserMemories,
  type CreateMemoryInput,
} from './memories';

// Storage operations
export {
  uploadMemoryPhoto,
  uploadAvatar,
  removeAvatar,
  deleteAllUserStorage,
  getPublicUrl,
  type UploadResult,
} from './storage';

// User operations
export {
  updateProfile,
  getProfileStats,
  signOut,
  getUserIdByEmail,
  getEmailByUserId,
  type UpdateProfileInput,
} from './user';

// Common types
export type { ServiceResult } from './journeys';

