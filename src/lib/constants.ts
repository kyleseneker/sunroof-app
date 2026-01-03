/**
 * Centralized application constants
 */

// App metadata
export const APP_NAME = 'Sunroof';
export const APP_TAGLINE = 'Capture now, relive later';
export const APP_DESCRIPTION = 'The delayed camera. Take photos and notes during your journey. Unlock them when you\'re ready to remember.';
export const APP_VERSION = '1.0.0';
export const APP_URL = 'https://getsunroof.com';

// Limits
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_JOURNEY_NAME_LENGTH = 50;
export const MAX_NOTE_LENGTH = 10_000;
export const MAX_DESTINATION_LENGTH = 100;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif)$/i;

// Audio recording
export const MAX_AUDIO_DURATION_SECONDS = 60;
export const AUDIO_SAMPLE_RATE = 44100;
export const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/ogg',
] as const;

// Image compression
export const IMAGE_COMPRESSION = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeKB: 500,
} as const;

// UI timing
export const MIN_TOUCH_TARGET = 44;
export const TOAST_DURATION_MS = 3000;
export const ERROR_TOAST_DURATION_MS = 4000;
export const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;
export const PULL_TO_REFRESH_THRESHOLD = 80;

// Defaults
export const DEFAULT_UNLOCK_DAYS = 3;
export const UNLOCK_DAY_OPTIONS = [1, 3, 7, 14, 30] as const;
export const MAX_ACTIVE_JOURNEYS = 10;

// Storage keys
export const STORAGE_KEY_INTRO_SEEN = 'sunroof_intro';
export const STORAGE_KEY_OTP_EMAIL = 'otp-email';
export const STORAGE_KEY_OTP_SENT = 'otp-sent';

// API endpoints
export const API_ENDPOINTS = {
  aiRecap: '/api/ai/recap',
} as const;

// Routes
export const EXTERNAL_URLS = {
  privacy: '/privacy',
  terms: '/terms',
} as const;

// Journey card gradient palettes
export const JOURNEY_GRADIENT_PALETTES = [
  { colors: ['#FF6B6B', '#FF8E53', '#FFC857'], angle: 135 },
  { colors: ['#0F2027', '#203A43', '#2C5364'], angle: 160 },
  { colors: ['#11998E', '#38EF7D', '#45B7D1'], angle: 135 },
  { colors: ['#2E1437', '#6B2D5C', '#F0433A'], angle: 150 },
  { colors: ['#00B4DB', '#0083B0', '#005C8A'], angle: 180 },
  { colors: ['#F2994A', '#F2C94C', '#F8E71C'], angle: 135 },
  { colors: ['#0F0C29', '#302B63', '#24243E'], angle: 135 },
  { colors: ['#C94B4B', '#D97B49', '#4B134F'], angle: 160 },
  { colors: ['#134E5E', '#71B280', '#4DA767'], angle: 145 },
  { colors: ['#8E2DE2', '#4A00E0', '#0ABFBC'], angle: 135 },
  { colors: ['#FFC3A0', '#FFAFBD', '#FF8EC7'], angle: 135 },
  { colors: ['#000428', '#004E92', '#007ADF'], angle: 180 },
  { colors: ['#1F1C2C', '#928DAB', '#ED213A'], angle: 160 },
  { colors: ['#232526', '#414345', '#5C6168'], angle: 135 },
  { colors: ['#0D4524', '#1D976C', '#93F9B9'], angle: 150 },
] as const;

// Destination autocomplete suggestions
export const DESTINATION_SUGGESTIONS = [
  'Miami', 'Tokyo', 'Paris', 'Bali', 'New York', 'Barcelona', 'Sydney',
  'Rome', 'London', 'Santorini', 'Iceland', 'Morocco', 'Cancun',
  'Hawaii', 'Dubai', 'Amsterdam', 'Prague', 'Costa Rica', 'Portugal',
  'Thailand', 'Greece', 'Mexico City', 'Nashville', 'Austin', 'Seattle',
] as const;

// Note prompts by time of day
export const NOTE_PROMPTS = {
  morning: [
    'This morning I noticed...',
    'The light here feels...',
    'I woke up feeling...',
    'Right now I can hear...',
    'Today I\'m hoping to...',
  ],
  afternoon: [
    'Something that surprised me today...',
    'The best thing I ate was...',
    'I had a conversation about...',
    'I want to remember this because...',
    'This place makes me feel...',
  ],
  evening: [
    'The highlight of today was...',
    'A moment that made me smile...',
    'I\'m grateful for...',
    'Something I learned today...',
    'Right now I\'m feeling...',
  ],
  night: [
    'Looking back on today...',
    'A quiet thought before sleep...',
    'Tomorrow I want to...',
    'The best part of today was...',
    'I\'ll remember this trip because...',
  ],
} as const;

export type TimeOfDay = keyof typeof NOTE_PROMPTS;

// Photo filters - inspired by Instagram, VSCO, and iPhone
export const PHOTO_FILTERS = {
  none: {
    name: 'Original',
    filter: 'none',
  },
  // Instagram-inspired
  clarendon: {
    name: 'Clarendon',
    filter: 'contrast(1.2) saturate(1.35) brightness(1.05)',
  },
  juno: {
    name: 'Juno',
    filter: 'sepia(0.1) saturate(1.4) contrast(1.1) brightness(1.05)',
  },
  lark: {
    name: 'Lark',
    filter: 'saturate(0.9) contrast(1.1) brightness(1.15) hue-rotate(-5deg)',
  },
  gingham: {
    name: 'Gingham',
    filter: 'sepia(0.15) saturate(0.8) contrast(0.9) brightness(1.1)',
  },
  // VSCO-inspired
  fade: {
    name: 'Fade',
    filter: 'saturate(0.75) contrast(0.85) brightness(1.2)',
  },
  film: {
    name: 'Film',
    filter: 'sepia(0.2) saturate(1.1) contrast(1.05) brightness(0.98)',
  },
  // iPhone-inspired
  vivid: {
    name: 'Vivid',
    filter: 'saturate(1.5) contrast(1.15) brightness(1.02)',
  },
  dramatic: {
    name: 'Dramatic',
    filter: 'contrast(1.4) saturate(1.1) brightness(0.9)',
  },
  mono: {
    name: 'Mono',
    filter: 'grayscale(1) contrast(1.1)',
  },
  noir: {
    name: 'Noir',
    filter: 'grayscale(1) contrast(1.4) brightness(0.9)',
  },
} as const;

export type PhotoFilterKey = keyof typeof PHOTO_FILTERS;
