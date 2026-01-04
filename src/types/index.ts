/**
 * Core Types for Sunroof App
 */

export interface UserMetadata {
  display_name?: string;
  avatar_url?: string;
  full_name?: string;
  picture?: string;
  email_verified?: boolean;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
  created_at?: string;
}

export type JourneyStatus = 'active' | 'completed';

export interface Journey {
  id: string;
  user_id: string;
  name: string;
  destination?: string | null;
  unlock_date: string;
  status: JourneyStatus;
  shared_with?: string[] | null;
  emoji?: string | null;
  cover_image_url?: string | null;
  cover_image_attribution?: string | null;
  deleted_at?: string | null;
  created_at: string;
  memory_count?: number;
}

export interface MemoryWeather {
  temp: number;
  condition: string;
  icon: string;
  humidity?: number;
}

export interface MemoryLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface Memory {
  id: string;
  journey_id: string;
  type: 'photo' | 'text' | 'audio';
  url?: string | null;
  note?: string | null;
  duration?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  weather?: MemoryWeather | null;
  deleted_at?: string | null;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh?: string;
  auth?: string;
  created_at: string;
  updated_at?: string;
}

export interface AIRecapResponse {
  recap: string | null;
  highlights: string[];
  error?: string;
}

export interface HapticPattern {
  light: number;
  medium: number;
  heavy: number;
  success: number[];
  warning: number[];
  error: number[];
  selection: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export interface CompressionStats {
  originalKB: number;
  compressedKB: number;
  savedKB: number;
  percentage: number;
}
