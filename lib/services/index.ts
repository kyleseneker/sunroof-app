/**
 * Service Layer
 */

// Common types
export { type ServiceResult, success, failure } from './types';

// Journey operations
export {
  createJourney,
  updateJourney,
  deleteJourney,
  fetchActiveJourneys,
  fetchPastJourneys,
  getJourneyCounts,
  exportUserData,
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
  deleteAllUserJourneysData,
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
  getCurrentUser,
  updateProfile,
  getProfileStats,
  signOut,
  getUserIdByEmail,
  getEmailByUserId,
  type UpdateProfileInput,
} from './user';
